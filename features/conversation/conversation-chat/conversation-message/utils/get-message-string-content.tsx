import { IConversationMessageContent } from "@/features/conversation/conversation-chat/conversation-message/conversation-message.types"
import {
  messageContentIsGroupUpdated,
  messageContentIsMultiRemoteAttachment,
  messageContentIsReaction,
  messageContentIsRemoteAttachment,
  messageContentIsReply,
  messageContentIsStaticAttachment,
  messageContentIsText,
} from "@/features/conversation/conversation-chat/conversation-message/utils/conversation-message-assertions"

export function getMessageContentStringValue(content: IConversationMessageContent) {
  if (messageContentIsText(content)) {
    return content.text
  }

  if (messageContentIsRemoteAttachment(content)) {
    return content.url
  }

  if (messageContentIsStaticAttachment(content)) {
    content.filename
    return content.filename
  }

  if (messageContentIsReaction(content)) {
    return `${content.action} "${content.content}"`
  }

  if (messageContentIsGroupUpdated(content)) {
    return "Group updated"
  }

  if (messageContentIsMultiRemoteAttachment(content)) {
    return "Multi remote attachment"
  }

  if (messageContentIsReply(content)) {
    return getMessageContentStringValue(content.content)
  }

  const _exhaustiveCheck: never = content
  throw new Error(
    `Unhandled message content type in getMessageContentStringValue: ${JSON.stringify(content, null, 2)}`,
  )
}
