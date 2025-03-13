import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"

// Core type identifiers
export type IConversationMessageId = string & {
  readonly brand: unique symbol
}

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
  id: IConversationMessageId
  status: IConversationMessageStatus
  senderInboxId: IXmtpInboxId
  sentNs: number
}

// Message content types
export type IConversationMessageTextContent = {
  text: string
}

export type IConversationMessageReactionContent = {
  reference: string
  action: "added" | "removed" | "unknown"
  schema: "unicode" | "shortcode" | "custom" | "unknown"
  content: string
}

export type IConversationMessageReplyContent = {
  reference: string
  content: IConversationMessageContent
}

export type IConversationMessageGroupUpdatedContent = {
  initiatedByInboxId: IXmtpInboxId
  membersAdded: Array<{ inboxId: IXmtpInboxId }>
  membersRemoved: Array<{ inboxId: IXmtpInboxId }>
  metadataFieldsChanged: Array<IGroupUpdatedMetadataEntry>
}

export type IGroupUpdatedMetadataEntry = {
  oldValue: string
  newValue: string
  fieldName: string
}

export type IRemoteAttachmentInfo = {
  filename?: string
  secret: string
  salt: string
  nonce: string
  contentDigest: string
  contentLength?: string
  scheme: "https://"
  url: string
}

export type IConversationMessageRemoteAttachmentContent = IRemoteAttachmentInfo

export type IConversationMessageMultiRemoteAttachmentContent = {
  attachments: Array<IRemoteAttachmentInfo & { contentLength: string }>
}

export type IConversationMessageStaticAttachmentContent = {
  filename: string
  mimeType: string
  data: string
}

export type IConversationMessageReadReceiptContent = {
  readByInboxIds: Array<IXmtpInboxId>
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
  | IConversationMessageMultiRemoteAttachment
