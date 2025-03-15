import {
  IConversationMessage,
  IConversationMessageContent,
  IConversationMessageGroupUpdatedContent,
  IConversationMessageMultiRemoteAttachmentContent,
  IConversationMessageReactionContent,
  IConversationMessageRemoteAttachmentContent,
  IConversationMessageReplyContent,
  IConversationMessageStaticAttachmentContent,
  IConversationMessageTextContent,
} from "@/features/conversation/conversation-chat/conversation-message/conversation-message.types"
import {
  messageContentIsGroupUpdated,
  messageContentIsMultiRemoteAttachment,
  messageContentIsReaction,
  messageContentIsRemoteAttachment,
  messageContentIsReply,
  messageContentIsStaticAttachment,
  messageContentIsText,
} from "@/features/conversation/conversation-chat/conversation-message/utils/conversation-message-assertions"

/**
 * Determines the correct message type based on the content structure
 * and returns a properly typed message object with the content.
 */
export function getMessageWithType<T extends Omit<IConversationMessage, "type" | "content">>(args: {
  baseMessage: T
  content: IConversationMessageContent
}): IConversationMessage {
  const { baseMessage, content } = args

  if (messageContentIsText(content)) {
    return {
      ...baseMessage,
      type: "text",
      content: content as IConversationMessageTextContent,
    }
  }

  if (messageContentIsReaction(content)) {
    return {
      ...baseMessage,
      type: "reaction",
      content: content as IConversationMessageReactionContent,
    }
  }

  if (messageContentIsGroupUpdated(content)) {
    return {
      ...baseMessage,
      type: "groupUpdated",
      content: content as IConversationMessageGroupUpdatedContent,
    }
  }

  if (messageContentIsReply(content)) {
    return {
      ...baseMessage,
      type: "reply",
      content: content as IConversationMessageReplyContent,
    }
  }

  if (messageContentIsRemoteAttachment(content)) {
    return {
      ...baseMessage,
      type: "remoteAttachment",
      content: content as IConversationMessageRemoteAttachmentContent,
    }
  }

  if (messageContentIsStaticAttachment(content)) {
    return {
      ...baseMessage,
      type: "staticAttachment",
      content: content as IConversationMessageStaticAttachmentContent,
    }
  }

  if (messageContentIsMultiRemoteAttachment(content)) {
    return {
      ...baseMessage,
      type: "multiRemoteAttachment",
      content: content as IConversationMessageMultiRemoteAttachmentContent,
    }
  }

  const _exhaustiveCheck: never = content

  // If we can't determine the type, we'll need to handle this case
  // This could throw an error or return a default type
  throw new Error("Unknown message content type")
}
