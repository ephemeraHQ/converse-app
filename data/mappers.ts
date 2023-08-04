import "reflect-metadata";

import { getLensHandleFromConversationIdAndPeer } from "../utils/lens";
import { ConversationEntity } from "./db/entities/conversationEntity";
import { MessageEntity } from "./db/entities/messageEntity";
import { XmtpConversation, XmtpMessage } from "./store/chatStore";
import { ProfileSocials } from "./store/profilesStore";

// Methods to map entities (SQLite data) to store (Zustand, in RAM)

export const xmtpMessageToDb = (
  xmtpMessage: XmtpMessage,
  conversationTopic: string
): MessageEntity => ({
  id: xmtpMessage.id,
  senderAddress: xmtpMessage.senderAddress,
  sent: xmtpMessage.sent,
  content: xmtpMessage.content || "",
  conversationId: conversationTopic,
  status: xmtpMessage.status || "sent",
  sentViaConverse: !!xmtpMessage.sentViaConverse,
  contentType: xmtpMessage.contentType,
  contentFallback: xmtpMessage.contentFallback,
  // we don't include the reactions field as it is
  // filled by other methods
});

export const xmtpMessageFromDb = (message: MessageEntity): XmtpMessage => ({
  id: message.id,
  senderAddress: message.senderAddress,
  sent: message.sent,
  content: message.content,
  status: message.status,
  sentViaConverse: !!message.sentViaConverse,
  contentType: message.contentType,
  contentFallback: message.contentFallback,
  reactions: message.reactions || "{}",
});

export const xmtpConversationToDb = (
  xmtpConversation: XmtpConversation
): ConversationEntity => ({
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
  dbConversation: ConversationEntity,
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
  const unsDomain = socials?.unstoppableDomains?.find(
    (d) => d.isPrimary
  )?.domain;
  const conversationTitle = lensHandle || ensName || unsDomain;

  return {
    topic: dbConversation.topic,
    peerAddress: dbConversation.peerAddress,
    createdAt: dbConversation.createdAt,
    context,
    messages: dbConversation.messages
      ? new Map(
          dbConversation.messages.map((m) => [m.id, xmtpMessageFromDb(m)])
        )
      : new Map(),
    conversationTitle,
    readUntil: dbConversation.readUntil || 0,
    pending: dbConversation.pending,
  };
};
