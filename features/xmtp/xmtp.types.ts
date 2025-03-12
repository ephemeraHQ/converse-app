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

export type IXmtpConversationWithCodecs = Conversation<ISupportedXmtpCodecs>

export type IXmtpDmWithCodecs = Dm<ISupportedXmtpCodecs>

export type IXmtpGroupWithCodecs = Group<ISupportedXmtpCodecs>

export type IXmtpDecodedTextMessage = DecodedMessage<TextCodec>
export type IXmtpDecodedReactionMessage = DecodedMessage<ReactionCodec>
export type IXmtpDecodedGroupUpdatedMessage = DecodedMessage<GroupUpdatedCodec>
export type IXmtpDecodedReplyMessage = DecodedMessage<ReplyCodec>
// export type IXmtpDecodedReadReceiptMessage =
//   DecodedMessage<ReadReceiptCodec>;
export type IXmtpDecodedRemoteAttachmentMessage = DecodedMessage<RemoteAttachmentCodec>
export type IXmtpDecodedStaticAttachmentMessage = DecodedMessage<StaticAttachmentCodec>
export type IXmtpDecodedMultiRemoteAttachmentMessage = DecodedMessage<MultiRemoteAttachmentCodec>

export type IXmtpInboxId = InboxId
// Add later
//  & {
//   readonly brand: unique symbol
// }

export type IXmtpConversationTopic = ConversationTopic

export type IXmtpConsentState = ConsentState

export type IXmtpMessageId = MessageId

// export type IXmtpDecodedMessageWrong = DecodedMessage<
//   ISupportedXmtpCodecs[number]
// >;

export type IXmtpDecodedMessage =
  | IXmtpDecodedTextMessage
  | IXmtpDecodedReactionMessage
  | IXmtpDecodedGroupUpdatedMessage
  | IXmtpDecodedReplyMessage
  | IXmtpDecodedRemoteAttachmentMessage
  | IXmtpDecodedStaticAttachmentMessage
  | IXmtpDecodedMultiRemoteAttachmentMessage

export type IXmtpDecodedActualMessage =
  | IXmtpDecodedTextMessage
  | IXmtpDecodedReactionMessage
  | IXmtpDecodedReplyMessage
  | IXmtpDecodedRemoteAttachmentMessage
  | IXmtpDecodedStaticAttachmentMessage
  | IXmtpDecodedMultiRemoteAttachmentMessage

export type IXmtpSigner = Signer

export type IXmtpEnv = "dev" | "production" | "local"

export type IXmtpClient = Client<ISupportedXmtpCodecs>

export type IXmtpConversationId = ConversationId

export type IXmtpConversationVersion = ConversationVersion

export type IXmtpDecryptedLocalAttachment = DecryptedLocalAttachment

export type IXmtpGroupUpdatedContent = GroupUpdatedContent

export type IXmtpMessageDeliveryStatus =
  | MessageDeliveryStatus.UNPUBLISHED
  | MessageDeliveryStatus.PUBLISHED
  | MessageDeliveryStatus.FAILED
  | MessageDeliveryStatus.ALL

export const IXmtpMessageDeliveryStatusValues = MessageDeliveryStatus

export type IXmtpGroupUpdatedMetadataEntry = GroupUpdatedMetadatEntry

export type IXmtpNativeMessageContent = NativeMessageContent

export type IXmtpPublicIdentity = PublicIdentity

export type IXmtpReactionContent = ReactionContent

export type IXmtpRemoteAttachmentContent = RemoteAttachmentContent

export type IXmtpRemoteAttachmentInfo = RemoteAttachmentInfo

export type IXmtpRemoteAttachmentMetadata = RemoteAttachmentMetadata

export type IXmtpStaticAttachmentContent = StaticAttachmentContent
