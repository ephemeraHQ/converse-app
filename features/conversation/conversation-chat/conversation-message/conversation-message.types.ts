import {
  IXmtpConversationId,
  IXmtpConversationTopic,
  IXmtpInboxId,
  IXmtpMessageId,
} from "@/features/xmtp/xmtp.types"

export type IConversationMessageStatus = "sending" | "sent" | "error"

export type IConversationMessageContentType =
  | "text"
  | "reaction"
  | "groupUpdated"
  | "reply"
  | "remoteAttachment"
  | "staticAttachment"
  | "multiRemoteAttachment"

// Base message structure
export type IConversationMessageBase = {
  status: IConversationMessageStatus
  senderInboxId: IXmtpInboxId
  sentNs: number
  xmtpId: IXmtpMessageId
  xmtpTopic: IXmtpConversationTopic
  xmtpConversationId: IXmtpConversationId
}

// Message content types
export type IConversationMessageTextContent = {
  text: string
}

export type IConversationMessageReactionContent = {
  reference: IXmtpMessageId
  action: "added" | "removed" | "unknown"
  schema: "unicode" | "shortcode" | "custom" | "unknown"
  content: string
}

export type IConversationMessageReplyContent = {
  reference: IXmtpMessageId
  content: IConversationMessageContent
}

export type IConversationMessageGroupUpdatedContent = {
  initiatedByInboxId: IXmtpInboxId
  membersAdded: { inboxId: IXmtpInboxId }[]
  membersRemoved: { inboxId: IXmtpInboxId }[]
  metadataFieldsChanged: IGroupUpdatedMetadataEntry[]
}

export type IGroupUpdatedMetadataEntry = {
  oldValue: string
  newValue: string
  fieldName: string
}

export type IConversationAttachment = {
  filename?: string
  secret: string
  salt: string
  nonce: string
  contentDigest: string
  scheme: "https://"
  url: string
  contentLength: string
}

export type IConversationMessageRemoteAttachmentContent = IConversationAttachment

export type IConversationMessageMultiRemoteAttachmentContent = {
  attachments: IConversationAttachment[]
}

export type IConversationMessageStaticAttachmentContent = {
  filename: string
  mimeType: string
  data: string
}

export type IConversationMessageReadReceiptContent = {
  readByInboxIds: IXmtpInboxId[]
}

// Union type for all content types
export type IConversationMessageContent =
  | IConversationMessageTextContent
  | IConversationMessageReactionContent
  | IConversationMessageGroupUpdatedContent
  | IConversationMessageReplyContent
  | IConversationMessageRemoteAttachmentContent
  | IConversationMessageStaticAttachmentContent
  | IConversationMessageMultiRemoteAttachmentContent

// Concrete message types
export type IConversationMessageText = IConversationMessageBase & {
  type: "text"
  content: IConversationMessageTextContent
}

export type IConversationMessageReaction = IConversationMessageBase & {
  type: "reaction"
  content: IConversationMessageReactionContent
}

export type IConversationMessageReply = IConversationMessageBase & {
  type: "reply"
  content: IConversationMessageReplyContent
}

export type IConversationMessageGroupUpdated = IConversationMessageBase & {
  type: "groupUpdated"
  content: IConversationMessageGroupUpdatedContent
}

export type IConversationMessageRemoteAttachment = IConversationMessageBase & {
  type: "remoteAttachment"
  content: IConversationMessageRemoteAttachmentContent
}

export type IConversationMessageStaticAttachment = IConversationMessageBase & {
  type: "staticAttachment"
  content: IConversationMessageStaticAttachmentContent
}

export type IConversationMessageMultiRemoteAttachment = IConversationMessageBase & {
  type: "multiRemoteAttachment"
  content: IConversationMessageMultiRemoteAttachmentContent
}

// Union type for all message types
export type IConversationMessage =
  | IConversationMessageText
  | IConversationMessageReaction
  | IConversationMessageGroupUpdated
  | IConversationMessageReply
  | IConversationMessageRemoteAttachment
  | IConversationMessageStaticAttachment
  | IConversationMessageMultiRemoteAttachment // ===== Message Types =====
