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
  Member,
  MessageDeliveryStatus,
  MultiRemoteAttachmentCodec,
  NativeMessageContent,
  ReactionCodec,
  ReactionContent,
  RemoteAttachmentCodec,
  RemoteAttachmentContent,
  RemoteAttachmentInfo,
  RemoteAttachmentMetadata,
  ReplyCodec,
  ReplyContent,
  Signer,
  StaticAttachmentCodec,
  StaticAttachmentContent,
  TextCodec,
} from "@xmtp/react-native-sdk"
import { ConversationSendPayload, MessageId } from "@xmtp/react-native-sdk/build/lib/types"
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
export type IXmtpGroupMember = Member

export type IXmtpConsentState = ConsentState

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
/**
 * NativeMessageContent is an object with specific fields for different content types
 * Used for message content that will be sent directly to the XMTP SDK
 */
export type IXmtpDecodedMessageNativeContent = NativeMessageContent
export type IXmtpTextContent = string
export type IXmtpReactionContent = ReactionContent
export type IXmtpGroupUpdatedContent = GroupUpdatedContent
export type IXmtpGroupUpdatedMetadataEntry = GroupUpdatedMetadatEntry
export type IXmtpRemoteAttachmentContent = RemoteAttachmentContent
export type IXmtpStaticAttachmentContent = StaticAttachmentContent
export type IXmtpReplyContent = ReplyContent

// ===== Attachment Types =====
export type IXmtpDecryptedLocalAttachment = DecryptedLocalAttachment
export type IXmtpRemoteAttachmentInfo = RemoteAttachmentInfo
export type IXmtpRemoteAttachmentMetadata = RemoteAttachmentMetadata

// ===== Client & Identity Types =====
export type IXmtpClientWithCodecs = Omit<Client<ISupportedXmtpCodecs>, "inboxId"> & {
  inboxId: IXmtpInboxId
}

export type IXmtpSigner = Signer
export type IXmtpEnv = "dev" | "production" | "local"

// ===== Message Delivery Status =====
export type IXmtpMessageDeliveryStatus =
  | MessageDeliveryStatus.UNPUBLISHED
  | MessageDeliveryStatus.PUBLISHED
  | MessageDeliveryStatus.FAILED
  | MessageDeliveryStatus.ALL

export const IXmtpMessageDeliveryStatusValues = MessageDeliveryStatus

// We're not going to use strings as content types
export type IXmtpConversationSendPayload = Exclude<
  ConversationSendPayload<ISupportedXmtpCodecs>,
  string
>

export type IXmtpMessageId = MessageId
