import { IConversationMessage } from "@/features/conversation/conversation-chat/conversation-message/conversation-message.types"
import {
  isGroupUpdatedMessage,
  isReactionMessage,
  isRemoteAttachmentMessage,
  isReplyMessage,
  isStaticAttachmentMessage,
  isTextMessage,
  messageContentIsGroupUpdated,
  messageContentIsMultiRemoteAttachment,
  messageContentIsRemoteAttachment,
  messageContentIsStaticAttachment,
  messageContentIsText,
} from "@/features/conversation/conversation-chat/conversation-message/utils/conversation-message-assertions"

export function getMessageStringContent(message: IConversationMessage) {
  const content = message.content

  if (typeof content === "string") {
    return content
  }

  if (isTextMessage(message)) {
    return message.content.text
  }

  if (isRemoteAttachmentMessage(message)) {
    return message.content.url
  }

  if (isStaticAttachmentMessage(message)) {
    return message.content.filename
  }

  if (isReactionMessage(message)) {
    return message.content.content
  }

  if (isReplyMessage(message)) {
    const replyContent = message.content
    if (messageContentIsText(replyContent)) {
      return replyContent.text
    }

    if (messageContentIsRemoteAttachment(replyContent)) {
      return replyContent.url
    }

    if (messageContentIsStaticAttachment(replyContent)) {
      return replyContent.filename
    }

    if (messageContentIsGroupUpdated(replyContent)) {
      return "Group updated"
    }

    if (messageContentIsRemoteAttachment(replyContent)) {
      return replyContent.url
    }

    if (messageContentIsMultiRemoteAttachment(replyContent)) {
      return "Multi remote attachment"
    }

    return ""
  }

  if (isGroupUpdatedMessage(message)) {
    return "Group updated"
  }

  return ""
}
