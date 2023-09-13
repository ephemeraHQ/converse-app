import RNFS from "react-native-fs";

import { getRepository } from "../../db";
import { Message } from "../../db/entities/messageEntity";
import { upsertRepository } from "../../db/upsert";
import { xmtpMessageFromDb, xmtpMessageToDb } from "../../mappers";
import { getChatStore } from "../../store/accountsStore";
import { XmtpMessage } from "../../store/chatStore";

export const saveMessages = async (
  account: string,
  messages: XmtpMessage[]
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
  getChatStore(account).getState().setMessages(messages);

  // Then save to db
  const messageRepository = await getRepository(account, "message");
  await upsertRepository(
    messageRepository,
    messages.map((xmtpMessage) =>
      xmtpMessageToDb(xmtpMessage, xmtpMessage.topic)
    ),
    ["id"],
    false
  );
};

export const updateMessagesIds = async (
  account: string,
  messageIdsToUpdate: {
    [messageId: string]: {
      newMessageId: string;
      newMessageSent: number;
      message: Message;
    };
  }
) => {
  const messagesToDispatch: {
    topic: string;
    message: XmtpMessage;
    oldId: string;
  }[] = [];
  const messageRepository = await getRepository(account, "message");
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
  getChatStore(account).getState().updateMessagesIds(messagesToDispatch);
};

export const markMessageAsSent = async (
  account: string,
  messageId: string,
  topic: string
) => {
  const messageRepository = await getRepository(account, "message");
  await messageRepository.update({ id: messageId }, { status: "sent" });
  getChatStore(account)
    .getState()
    .updateMessageStatus(topic, messageId, "sent");
};

export const getMessagesToSend = async (account: string) => {
  const messageRepository = await getRepository(account, "message");
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
