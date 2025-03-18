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
  return content && typeof content === "object" && "attachment" in content
}

export function messageContentIsText(
  content: IConversationMessageContent,
): content is IConversationMessageTextContent {
  return content && typeof content === "object" && "text" in content
}

export function messageContentIsRemoteAttachment(
  content: IConversationMessageContent,
): content is IConversationMessageRemoteAttachmentContent {
  return content && typeof content === "object" && "secret" in content && "url" in content
}

export function messageContentIsMultiRemoteAttachment(
  content: IConversationMessageContent,
): content is IConversationMessageMultiRemoteAttachmentContent {
  return content && typeof content === "object" && "multiRemoteAttachment" in content
}

export function messageContentIsReaction(
  content: IConversationMessageContent,
): content is IConversationMessageReactionContent {
  return content && typeof content === "object" && "reaction" in content
}

export function messageContentIsGroupUpdated(
  content: IConversationMessageContent,
): content is IConversationMessageGroupUpdatedContent {
  return content && typeof content === "object" && "membersAdded" in content
}

export function messageContentIsReply(
  content: IConversationMessageContent,
): content is IConversationMessageReplyContent {
  return content && typeof content === "object" && "reply" in content
}
