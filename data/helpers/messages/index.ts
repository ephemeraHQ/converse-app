import { Platform } from "react-native";

import { moveAssetsForMessage } from "../../../utils/fileSystem";
import { isContentType } from "../../../utils/xmtpRN/contentTypes";
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
      (isContentType("reaction", c.contentType) ||
        isContentType("text", c.contentType))
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
  // Let's save by batch to avoid hermes issues
  let batch: XmtpMessage[] = [];
  let rest = messages;
  while (rest.length > 0) {
    batch = rest.slice(0, 5000);
    rest = rest.slice(5000);
    await upsertRepository(
      messageRepository,
      batch.map((xmtpMessage) =>
        xmtpMessageToDb(xmtpMessage, xmtpMessage.topic)
      ),
      ["id"],
      false
    );
  }
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
    await moveAssetsForMessage(
      messageToUpdate.message.id,
      messageToUpdate.newMessageId
    );

    if (Platform.OS === "web") {
      messagesToDispatch.push({
        topic: messageToUpdate.message.conversationId,
        message: {
          ...messageToUpdate.message,
          id: messageToUpdate.newMessageId,
          sent: messageToUpdate.newMessageSent,
          topic: messageToUpdate.message.conversationId,
        },
        oldId,
      });
    } else {
      const updatedMessage = await messageRepository.findOneBy({
        id: messageToUpdate.newMessageId,
      });

      if (!updatedMessage) throw new Error("Updated message does not exist");
      messagesToDispatch.push({
        topic: messageToUpdate.message.conversationId,
        message: xmtpMessageFromDb(updatedMessage),
        oldId,
      });
    }
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
