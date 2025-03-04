// todo(lustig) we'll be able to remove these once multi inbox client has more functionality
import {
  InboxId,
  Client as XmtpClient,
  Conversation as XmtpConversation,
  DecodedMessage as XmtpDecodedMessage,
  Dm as XmtpDm,
  Group as XmtpGroup,
  GroupUpdatedCodec as XmtpGroupUpdatedCodec,
  ReactionCodec as XmtpReactionCodec,
  // ReadReceiptCodec as XmtpReadReceiptCodec,
  RemoteAttachmentCodec as XmtpRemoteAttachmentCodec,
  ReplyCodec as XmtpReplyCodec,
  Signer as XmtpSigner,
  StaticAttachmentCodec as XmtpStaticAttachmentCodec,
  TextCodec as XmtpTextCodec,
} from "@xmtp/react-native-sdk"
import { ISupportedXmtpCodecs } from "./xmtp-codecs/xmtp-codecs"

export type IXmtpConversationWithCodecs = XmtpConversation<ISupportedXmtpCodecs>

export type IXmtpDmWithCodecs = XmtpDm<ISupportedXmtpCodecs>

export type IXmtpGroupWithCodecs = XmtpGroup<ISupportedXmtpCodecs>

export type IXmtpDecodedTextMessage = XmtpDecodedMessage<XmtpTextCodec>
export type IXmtpDecodedReactionMessage = XmtpDecodedMessage<XmtpReactionCodec>
export type IXmtpDecodedGroupUpdatedMessage = XmtpDecodedMessage<XmtpGroupUpdatedCodec>
export type IXmtpDecodedReplyMessage = XmtpDecodedMessage<XmtpReplyCodec>
// export type IXmtpDecodedReadReceiptMessage =
//   XmtpDecodedMessage<XmtpReadReceiptCodec>;
export type IXmtpDecodedRemoteAttachmentMessage = XmtpDecodedMessage<XmtpRemoteAttachmentCodec>
export type IXmtpDecodedStaticAttachmentMessage = XmtpDecodedMessage<XmtpStaticAttachmentCodec>

export type IXmtpInboxId = InboxId

// export type IXmtpDecodedMessageWrong = XmtpDecodedMessage<
//   ISupportedXmtpCodecs[number]
// >;

export type IXmtpDecodedMessage =
  | IXmtpDecodedTextMessage
  | IXmtpDecodedReactionMessage
  | IXmtpDecodedGroupUpdatedMessage
  | IXmtpDecodedReplyMessage
  // | IXmtpDecodedReadReceiptMessage
  | IXmtpDecodedRemoteAttachmentMessage
  | IXmtpDecodedStaticAttachmentMessage

export type IXmtpDecodedActualMessage =
  | IXmtpDecodedTextMessage
  | IXmtpDecodedReactionMessage
  | IXmtpDecodedReplyMessage
  | IXmtpDecodedRemoteAttachmentMessage
  | IXmtpDecodedStaticAttachmentMessage

export type IXmtpSigner = XmtpSigner

export type IXmtpEnv = "dev" | "production" | "local"

export type IXmtpClient = XmtpClient<ISupportedXmtpCodecs>
