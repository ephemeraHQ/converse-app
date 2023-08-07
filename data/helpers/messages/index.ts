import RNFS from "react-native-fs";

import { messageRepository } from "../../db";
import { Message } from "../../db/entities/messageEntity";
import { upsertRepository } from "../../db/upsert";
import { xmtpMessageFromDb, xmtpMessageToDb } from "../../mappers";
import { useChatStore } from "../../store/accountsStore";
import { XmtpMessage } from "../../store/chatStore";

export const saveMessages = async (
  messages: XmtpMessage[],
  conversationTopic: string
) => {
  // Infer referenced message from content if needed
  messages.forEach((c) => {
    if (
      !c.referencedMessageId &&
      c.contentType.startsWith("xmtp.org/reaction:")
    ) {
      try {
        c.referencedMessageId = JSON.parse(c.content).reference;
      } catch (e) {
        console.log(e);
      }
    }
  });
  // First dispatch for immediate feedback
  useChatStore.getState().setMessages(conversationTopic, messages);

  // Then save to db
  await upsertRepository(
    messageRepository,
    messages.map((xmtpMessage) =>
      xmtpMessageToDb(xmtpMessage, conversationTopic)
    ),
    ["id"]
  );
};

export const updateMessagesIds = async (messageIdsToUpdate: {
  [messageId: string]: {
    newMessageId: string;
    newMessageSent: number;
    message: Message;
  };
}) => {
  const messagesToDispatch: {
    topic: string;
    message: XmtpMessage;
    oldId: string;
  }[] = [];
  for (const oldId in messageIdsToUpdate) {
    const messageToUpdate = messageIdsToUpdate[oldId];
    await messageRepository.update(
      { id: messageToUpdate.message.id },
      { id: messageToUpdate.newMessageId, sent: messageToUpdate.newMessageSent }
    );
    // Let's also move message data & attachments if exists
    const oldMessageFolder = `${RNFS.DocumentDirectoryPath}/messages/${messageToUpdate.message.id}`;
    const newMessageFolder = `${RNFS.DocumentDirectoryPath}/messages/${messageToUpdate.newMessageId}`;
    const [messageFolderExists, updatedMessage] = await Promise.all([
      RNFS.exists(oldMessageFolder),
      messageRepository.findOneBy({
        id: messageToUpdate.newMessageId,
      }),
    ]);
    if (messageFolderExists) {
      await RNFS.moveFile(oldMessageFolder, newMessageFolder);
    }
    if (!updatedMessage) throw new Error("Updated message does not exist");
    messagesToDispatch.push({
      topic: messageToUpdate.message.conversationId,
      message: xmtpMessageFromDb(updatedMessage),
      oldId,
    });
  }
  useChatStore.getState().updateMessagesIds(messagesToDispatch);
};

export const markMessageAsSent = async (messageId: string, topic: string) => {
  await messageRepository.update({ id: messageId }, { status: "sent" });
  useChatStore.getState().updateMessageStatus(topic, messageId, "sent");
};

export const getMessagesToSend = async () => {
  const messagesToSend = await messageRepository.find({
    select: {
      id: true,
      conversationId: true,
      contentType: true,
      content: true,
      contentFallback: true,
    },
    where: {
      status: "sending",
      conversation: {
        pending: false,
      },
    },
    order: {
      sent: "ASC",
    },
  });
  return messagesToSend;
};
