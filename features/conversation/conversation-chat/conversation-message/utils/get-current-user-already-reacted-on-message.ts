import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { IConversationMessageId } from "@/features/conversation/conversation-chat/conversation-message/conversation-message.types"
import { getConversationMessagesQueryData } from "@/features/conversation/conversation-chat/conversation-messages.query"
import { IConversationTopic } from "@/features/conversation/conversation.types"

export function getCurrentUserAlreadyReactedOnMessage(args: {
  messageId: IConversationMessageId
  topic: IConversationTopic
  emoji: string | undefined // Specific emoji or just reacted in general
}) {
  const { messageId, topic, emoji } = args
  const currentSender = getSafeCurrentSender()
  const messages = getConversationMessagesQueryData({
    clientInboxId: currentSender.inboxId,
    topic,
  })
  const reactions = messages?.reactions[messageId]
  const bySender = reactions?.bySender
  return bySender?.[currentSender.inboxId!]?.some(
    (reaction) => !emoji || reaction.content === emoji,
  )
}
