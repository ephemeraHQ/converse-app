import {
  GroupUpdatedCodec,
  MultiRemoteAttachmentCodec,
  ReactionCodec,
  // ReadReceiptCodec,
  RemoteAttachmentCodec,
  ReplyCodec,
  StaticAttachmentCodec,
  TextCodec,
} from "@xmtp/react-native-sdk"

export const supportedXmtpCodecs = [
  new TextCodec(),
  new ReactionCodec(),
  new GroupUpdatedCodec(),
  new ReplyCodec(),
  new RemoteAttachmentCodec(),
  new StaticAttachmentCodec(),
  new MultiRemoteAttachmentCodec(),
  // new ReadReceiptCodec(),
]

export type ISupportedXmtpCodecs = typeof supportedXmtpCodecs

// Text content type
export function isXmtpTextContentType(contentType: string) {
  return contentType.startsWith("xmtp.org/text:")
}

// Remote attachment content type
export function isXmtpRemoteAttachmentContentType(contentType: string) {
  return contentType.startsWith("xmtp.org/remoteStaticAttachment:")
}

// Static attachment content type
export function isXmtpStaticAttachmentContentType(contentType: string) {
  return contentType.startsWith("xmtp.org/attachment:")
}

// Reaction content type
export function isXmtpReactionContentType(contentType: string) {
  return contentType.startsWith("xmtp.org/reaction:")
}

// Reply content type
export function isXmtpReplyContentType(contentType: string) {
  return contentType.startsWith("xmtp.org/reply:")
}

// Read receipt content type
export function isXmtpReadReceiptContentType(contentType: string) {
  return contentType.startsWith("xmtp.org/readReceipt:")
}

// Group updated content type
export function isXmtpGroupUpdatedContentType(contentType: string) {
  return contentType.startsWith("xmtp.org/group_updated:")
}

// Multi remote attachment content type
export function isXmtpMultiRemoteAttachmentContentType(contentType: string) {
  return contentType.startsWith("xmtp.org/multiRemoteStaticAttachment:")
}
