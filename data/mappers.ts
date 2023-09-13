import "reflect-metadata";

import { getLensHandleFromConversationIdAndPeer } from "../utils/lens";
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
      xmtpMessage.contentType.startsWith("xmtp.org/reaction:")
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
});

export const xmtpConversationFromDb = (
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

  const lensHandle = getLensHandleFromConversationIdAndPeer(
    dbConversation.contextConversationId,
    socials?.lensHandles
  );
  const ensName = socials?.ensNames?.find((e) => e.isPrimary)?.name;
  const unsDomain = socials?.unstoppableDomains?.find((d) => d.isPrimary)
    ?.domain;
  const conversationTitle = lensHandle || ensName || unsDomain;

  return {
    topic: dbConversation.topic,
    peerAddress: dbConversation.peerAddress,
    createdAt: dbConversation.createdAt,
    context,
    messages: xmtpMessagesMapFromDb(dbConversation.messages),
    conversationTitle,
    readUntil: dbConversation.readUntil || 0,
    pending: dbConversation.pending,
  };
};
