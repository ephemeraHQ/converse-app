import "reflect-metadata";

import { getPreferredName } from "../utils/profile";
import { isContentType } from "../utils/xmtpRN/contentTypes";
import { Conversation } from "./db/entities/conversationEntity";
import { Message } from "./db/entities/messageEntity";
import { XmtpConversation, XmtpMessage } from "./store/chatStore";
import { ProfileSocials } from "./store/profilesStore";

// Methods to map entities (SQLite data) to store (Zustand, in RAM)

export const xmtpMessageToDb = (
  xmtpMessage: XmtpMessage,
  conversationTopic: string
): Message => ({
  id: xmtpMessage.id,
  senderAddress: xmtpMessage.senderAddress,
  sent: xmtpMessage.sent,
  content: xmtpMessage.content || "",
  conversationId: conversationTopic,
  status: xmtpMessage.status || "sent",
  sentViaConverse: !!xmtpMessage.sentViaConverse,
  contentType: xmtpMessage.contentType,
  contentFallback: xmtpMessage.contentFallback,
  referencedMessageId: xmtpMessage.referencedMessageId,
});

export const xmtpMessageFromDb = (message: Message): XmtpMessage => ({
  id: message.id,
  senderAddress: message.senderAddress,
  sent: message.sent,
  content: message.content,
  status: message.status,
  sentViaConverse: !!message.sentViaConverse,
  contentType: message.contentType,
  contentFallback: message.contentFallback,
  referencedMessageId: message.referencedMessageId,
  topic: message.conversationId,
});

const xmtpMessagesMapFromDb = (
  messages?: Message[]
): Map<string, XmtpMessage> => {
  const messagesMap = new Map<string, XmtpMessage>();
  if (!messages) return messagesMap;
  messages.forEach((m) => {
    const xmtpMessage = xmtpMessageFromDb(m);
    messagesMap.set(xmtpMessage.id, xmtpMessage);
    if (
      xmtpMessage.referencedMessageId &&
      isContentType("reaction", xmtpMessage.contentType)
    ) {
      // This is a reaction to a message, let's save it to make
      // it easily accessible
      const referencedMessage = messagesMap.get(
        xmtpMessage.referencedMessageId
      );
      if (referencedMessage) {
        referencedMessage.reactions =
          referencedMessage.reactions || new Map<string, XmtpMessage>();
        referencedMessage.reactions.set(m.id, xmtpMessageFromDb(m));
      }
    }
  });
  return messagesMap;
};

export const xmtpConversationToDb = (
  xmtpConversation: XmtpConversation
): Conversation => ({
  topic: xmtpConversation.topic,
  peerAddress: xmtpConversation.peerAddress,
  createdAt: xmtpConversation.createdAt,
  contextConversationId: xmtpConversation.context?.conversationId,
  contextMetadata: xmtpConversation.context?.metadata
    ? JSON.stringify(xmtpConversation.context.metadata)
    : undefined,
  readUntil: xmtpConversation.readUntil || 0,
  pending: xmtpConversation.pending,
  version: xmtpConversation.version,
  spamScore: xmtpConversation.spamScore,
});

export const xmtpConversationFromDb = (
  account: string,
  dbConversation: Conversation,
  socials?: ProfileSocials
): XmtpConversation => {
  let context = undefined;
  if (dbConversation.contextConversationId) {
    context = {
      conversationId: dbConversation.contextConversationId,
      metadata: dbConversation.contextMetadata
        ? JSON.parse(dbConversation?.contextMetadata)
        : undefined,
    };
  }

  const conversationTitle = getPreferredName(
    socials,
    dbConversation.peerAddress,
    dbConversation.contextConversationId
  );

  const hasOneMessageFromMe = !!dbConversation.messages?.find(
    (m) => m.senderAddress === account
  );

  return {
    topic: dbConversation.topic,
    peerAddress: dbConversation.peerAddress,
    createdAt: dbConversation.createdAt,
    context,
    messages: xmtpMessagesMapFromDb(dbConversation.messages),
    messagesIds: dbConversation.messages?.map((m) => m.id) || [],
    conversationTitle,
    readUntil: dbConversation.readUntil || 0,
    pending: dbConversation.pending,
    version: dbConversation.version,
    hasOneMessageFromMe,
    spamScore: dbConversation.spamScore,
  };
};
