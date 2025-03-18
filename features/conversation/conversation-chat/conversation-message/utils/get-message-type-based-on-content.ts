import {
  IConversationMessageContent,
  IConversationMessageContentType,
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

export function getMessageTypeBaseOnContent(args: {
  content: IConversationMessageContent
}): IConversationMessageContentType {
  const { content } = args

  if (messageContentIsText(content)) {
    return "text"
  }

  if (messageContentIsRemoteAttachment(content)) {
    return "remoteAttachment"
  }

  if (messageContentIsStaticAttachment(content)) {
    return "staticAttachment"
  }

  if (messageContentIsReaction(content)) {
    return "reaction"
  }

  if (messageContentIsReply(content)) {
    return "reply"
  }

  if (messageContentIsGroupUpdated(content)) {
    return "groupUpdated"
  }

  if (messageContentIsMultiRemoteAttachment(content)) {
    return "multiRemoteAttachment"
  }

  const _exhaustiveCheck: never = content
  throw new Error(`Unhandled content type: ${content}`)
}
