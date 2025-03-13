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
export function isXmtpTextContent(contentType: string) {
  return contentType.startsWith("xmtp.org/text:")
}

// Remote attachment content type
export function isXmtpRemoteAttachmentContent(contentType: string) {
  return contentType.startsWith("xmtp.org/remoteStaticAttachment:")
}

// Static attachment content type
export function isXmtpStaticAttachmentContent(contentType: string) {
  return contentType.startsWith("xmtp.org/attachment:")
}

// Reaction content type
export function isXmtpReactionContent(contentType: string) {
  return contentType.startsWith("xmtp.org/reaction:")
}

// Reply content type
export function isXmtpReplyContent(contentType: string) {
  return contentType.startsWith("xmtp.org/reply:")
}

// Read receipt content type
export function isXmtpReadReceiptContent(contentType: string) {
  return contentType.startsWith("xmtp.org/readReceipt:")
}

// Group updated content type
export function isXmtpGroupUpdatedContent(contentType: string) {
  return contentType.startsWith("xmtp.org/group_updated:")
}

// Multi remote attachment content type
export function isXmtpMultiRemoteAttachmentContent(contentType: string) {
  return contentType.startsWith("xmtp.org/multiRemoteStaticAttachment:")
}
