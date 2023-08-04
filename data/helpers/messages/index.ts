import { Reaction } from "@xmtp/content-type-reaction";
import RNFS from "react-native-fs";

import { MessageReaction } from "../../../utils/reactions";
import { sentryTrackMessage } from "../../../utils/sentry";
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
  // First save all messages to db
  const upsertPromise = upsertRepository(
    messageRepository,
    messages.map((xmtpMessage) =>
      xmtpMessageToDb(xmtpMessage, conversationTopic)
    ),
    ["id"]
  );

  // Then dispatch
  useChatStore.getState().setMessages(conversationTopic, messages);

  const reactionMessages = messages.filter((m) =>
    m.contentType.startsWith("xmtp.org/reaction:")
  );

  // Now we can handle reactions if there are any
  if (reactionMessages.length > 0) {
    await upsertPromise;
    await saveReactions(reactionMessages, conversationTopic);
  }
};

const saveReactions = async (
  reactionMessages: XmtpMessage[],
  conversationTopic: string
) => {
  const reactionsByMessage: {
    [messageId: string]: { [reactionId: string]: MessageReaction };
  } = {};
  for (const reactionMessage of reactionMessages) {
    try {
      const reactionContent = JSON.parse(reactionMessage.content) as Reaction;
      reactionsByMessage[reactionContent.reference] =
        reactionsByMessage[reactionContent.reference] || {};
      reactionsByMessage[reactionContent.reference][reactionMessage.id] = {
        action: reactionContent.action,
        schema: reactionContent.schema,
        content: reactionContent.content,
        senderAddress: reactionMessage.senderAddress,
        sent: reactionMessage.sent,
      };
    } catch (e: any) {
      sentryTrackMessage("CANT_PARSE_REACTION_CONTENT", {
        reactionMessageContent: reactionMessage.content,
        error: e.toString(),
      });
    }
  }
  const reactionsToDispatch: { [messageId: string]: string } = {};
  for (const messageId in reactionsByMessage) {
    // Check if message exists
    const message = await messageRepository.findOneBy({
      id: messageId,
      conversationId: conversationTopic,
    });
    if (message) {
      const existingReactions = JSON.parse(message.reactions || "{}") as {
        [reactionId: string]: MessageReaction;
      };
      const newReactions = reactionsByMessage[messageId];
      const reactions = { ...existingReactions, ...newReactions };
      message.reactions = JSON.stringify(reactions);
      await messageRepository.save(message);
      reactionsToDispatch[messageId] = message.reactions;
    }
  }
  useChatStore
    .getState()
    .setMessagesReactions(conversationTopic, reactionsToDispatch);
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
