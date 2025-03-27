import {
  IConversationMessage,
  IConversationMessageContent,
  IConversationMessageGroupUpdated,
  IConversationMessageGroupUpdatedContent,
  IConversationMessageMultiRemoteAttachment,
  IConversationMessageMultiRemoteAttachmentContent,
  IConversationMessageReaction,
  IConversationMessageReactionContent,
  IConversationMessageRemoteAttachment,
  IConversationMessageRemoteAttachmentContent,
  IConversationMessageReply,
  IConversationMessageReplyContent,
  IConversationMessageStaticAttachment,
  IConversationMessageStaticAttachmentContent,
  IConversationMessageText,
  IConversationMessageTextContent,
} from "@/features/conversation/conversation-chat/conversation-message/conversation-message.types"
import { hasProperty } from "@/utils/general"

// Type-safe property keys
export type KeyOf<T> = keyof T

// Read receipt and group updates aren't "real" messages
export function isAnActualMessage(message: IConversationMessage): message is IConversationMessage {
  return !isReadReceiptMessage(message) && !isGroupUpdatedMessage(message)
}

/**
 * Message assertions
 */
export function isTextMessage(message: IConversationMessage): message is IConversationMessageText {
  return message.type === "text"
}

export function isReactionMessage(
  message: IConversationMessage,
): message is IConversationMessageReaction {
  return message.type === "reaction"
}

export function isReadReceiptMessage(message: IConversationMessage) {
  // TODO
  return false
}

export function isGroupUpdatedMessage(
  message: IConversationMessage,
): message is IConversationMessageGroupUpdated {
  return message.type === "groupUpdated"
}

export function isReplyMessage(
  message: IConversationMessage,
): message is IConversationMessageReply {
  return message.type === "reply"
}

export function isRemoteAttachmentMessage(
  message: IConversationMessage,
): message is IConversationMessageRemoteAttachment {
  return message.type === "remoteAttachment"
}

export function isStaticAttachmentMessage(
  message: IConversationMessage,
): message is IConversationMessageStaticAttachment {
  return message.type === "staticAttachment"
}

export function isMultiRemoteAttachmentMessage(
  message: IConversationMessage,
): message is IConversationMessageMultiRemoteAttachment {
  return message.type === "multiRemoteAttachment"
}

/**
 * Message content assertions
 */
export function messageContentIsStaticAttachment(
  content: IConversationMessageContent,
): content is IConversationMessageStaticAttachmentContent {
  return (
    hasProperty<IConversationMessageStaticAttachmentContent>(content, "filename") &&
    !messageContentIsReply(content)
  )
}

export function messageContentIsText(
  content: IConversationMessageContent,
): content is IConversationMessageTextContent {
  return (
    hasProperty<IConversationMessageTextContent>(content, "text") && !messageContentIsReply(content)
  )
}

export function messageContentIsRemoteAttachment(
  content: IConversationMessageContent,
): content is IConversationMessageRemoteAttachmentContent {
  return (
    hasProperty<IConversationMessageRemoteAttachmentContent>(content, "url") &&
    !messageContentIsReply(content)
  )
}

export function messageContentIsMultiRemoteAttachment(
  content: IConversationMessageContent,
): content is IConversationMessageMultiRemoteAttachmentContent {
  return (
    hasProperty<IConversationMessageMultiRemoteAttachmentContent>(content, "attachments") &&
    !messageContentIsReply(content)
  )
}

export function messageContentIsReaction(
  content: IConversationMessageContent,
): content is IConversationMessageReactionContent {
  return (
    hasProperty<IConversationMessageReactionContent>(content, "schema") &&
    hasProperty<IConversationMessageReactionContent>(content, "reference")
  )
}

export function messageContentIsGroupUpdated(
  content: IConversationMessageContent,
): content is IConversationMessageGroupUpdatedContent {
  return (
    hasProperty<IConversationMessageGroupUpdatedContent>(content, "membersAdded") &&
    !messageContentIsReply(content)
  )
}

export function messageContentIsReply(
  content: IConversationMessageContent,
): content is IConversationMessageReplyContent {
  return hasProperty<IConversationMessageReplyContent>(content, "reference")
}

export function messageGroupUpdatedContentIsEmpty(
  content: IConversationMessageGroupUpdatedContent,
) {
  return (
    content.membersAdded.length === 0 &&
    content.membersRemoved.length === 0 &&
    content.metadataFieldsChanged.length === 0
  )
}
