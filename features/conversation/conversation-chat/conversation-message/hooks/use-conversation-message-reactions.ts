import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { IConversationMessageId } from "@/features/conversation/conversation-chat/conversation-message/conversation-message.types"
import { useConversationMessagesQuery } from "@/features/conversation/conversation-chat/conversation-messages.query"
import { useCurrentConversationTopicSafe } from "@/features/conversation/conversation-chat/conversation.store-context"

export function useConversationMessageReactions(messageId: IConversationMessageId) {
  const currentSender = getSafeCurrentSender()
  const topic = useCurrentConversationTopicSafe()

  const { data: messages } = useConversationMessagesQuery({
    clientInboxId: currentSender.inboxId,
    topic,
    caller: "useConversationMessageReactions",
  })

  // TODO: Add another fallback query to fetch single message reactions. Coming in the SDK later
  return {
    bySender: messages?.reactions[messageId]?.bySender,
    byReactionContent: messages?.reactions[messageId]?.byReactionContent,
  }
}
