import {
  Client,
  ConsentState,
  Conversation,
  ConversationId,
  ConversationTopic,
  ConversationVersion,
  DecodedMessage,
  DecryptedLocalAttachment,
  Dm,
  Group,
  GroupUpdatedCodec,
  GroupUpdatedContent,
  GroupUpdatedMetadatEntry,
  InboxId,
  MessageDeliveryStatus,
  MessageId,
  MultiRemoteAttachmentCodec,
  NativeMessageContent,
  PublicIdentity,
  ReactionCodec,
  ReactionContent,
  RemoteAttachmentCodec,
  RemoteAttachmentContent,
  RemoteAttachmentInfo,
  RemoteAttachmentMetadata,
  ReplyCodec,
  Signer,
  StaticAttachmentCodec,
  StaticAttachmentContent,
  TextCodec,
} from "@xmtp/react-native-sdk"
import { ISupportedXmtpCodecs } from "./xmtp-codecs/xmtp-codecs"

// ===== Inbox Types =====
export type IXmtpInboxId = InboxId & {
  readonly brand: unique symbol
}

// ===== Conversation Types =====
export type IXmtpConversationWithCodecs = Conversation<ISupportedXmtpCodecs>
export type IXmtpDmWithCodecs = Dm<ISupportedXmtpCodecs>
export type IXmtpGroupWithCodecs = Group<ISupportedXmtpCodecs>
export type IXmtpConversationId = ConversationId
export type IXmtpConversationTopic = ConversationTopic
export type IXmtpConversationVersion = ConversationVersion

export type IXmtpConsentState = ConsentState

// ===== Message Types =====
export type IXmtpMessageId = MessageId

// Base message types for different content types
export type IXmtpDecodedTextMessage = DecodedMessage<TextCodec>
export type IXmtpDecodedReactionMessage = DecodedMessage<ReactionCodec>
export type IXmtpDecodedGroupUpdatedMessage = DecodedMessage<GroupUpdatedCodec>
export type IXmtpDecodedReplyMessage = DecodedMessage<ReplyCodec>

// Attachment message types
export type IXmtpDecodedRemoteAttachmentMessage = DecodedMessage<RemoteAttachmentCodec>
export type IXmtpDecodedStaticAttachmentMessage = DecodedMessage<StaticAttachmentCodec>
export type IXmtpDecodedMultiRemoteAttachmentMessage = DecodedMessage<MultiRemoteAttachmentCodec>

// Union types for message handling
export type IXmtpDecodedMessage =
  | IXmtpDecodedTextMessage
  | IXmtpDecodedReactionMessage
  | IXmtpDecodedGroupUpdatedMessage
  | IXmtpDecodedReplyMessage
  | IXmtpDecodedRemoteAttachmentMessage
  | IXmtpDecodedStaticAttachmentMessage
  | IXmtpDecodedMultiRemoteAttachmentMessage

// ===== Content Types =====
export type IXmtpNativeMessageContent = NativeMessageContent
export type IXmtpReactionContent = ReactionContent
export type IXmtpGroupUpdatedContent = GroupUpdatedContent
export type IXmtpGroupUpdatedMetadataEntry = GroupUpdatedMetadatEntry
export type IXmtpRemoteAttachmentContent = RemoteAttachmentContent
export type IXmtpStaticAttachmentContent = StaticAttachmentContent

// ===== Attachment Types =====
export type IXmtpDecryptedLocalAttachment = DecryptedLocalAttachment
export type IXmtpRemoteAttachmentInfo = RemoteAttachmentInfo
export type IXmtpRemoteAttachmentMetadata = RemoteAttachmentMetadata

// ===== Client & Identity Types =====
export type IXmtpClient = Omit<Client<ISupportedXmtpCodecs>, "inboxId"> & {
  inboxId: IXmtpInboxId
}
export type IXmtpSigner = Signer
export type IXmtpPublicIdentity = PublicIdentity
export type IXmtpEnv = "dev" | "production" | "local"

// ===== Message Delivery Status =====
export type IXmtpMessageDeliveryStatus =
  | MessageDeliveryStatus.UNPUBLISHED
  | MessageDeliveryStatus.PUBLISHED
  | MessageDeliveryStatus.FAILED
  | MessageDeliveryStatus.ALL

export const IXmtpMessageDeliveryStatusValues = MessageDeliveryStatus
