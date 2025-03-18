import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { useConversationMessagesQuery } from "@/features/conversation/conversation-chat/conversation-messages.query"
import { useCurrentXmtpConversationIdSafe } from "@/features/conversation/conversation-chat/conversation.store-context"
import { IXmtpMessageId } from "@/features/xmtp/xmtp.types"

export function useConversationMessageReactions(xmtpMessageId: IXmtpMessageId) {
  const currentSender = getSafeCurrentSender()
  const xmtpConversationId = useCurrentXmtpConversationIdSafe()

  const { data: messages } = useConversationMessagesQuery({
    clientInboxId: currentSender.inboxId,
    xmtpConversationId,
    caller: "useConversationMessageReactions",
  })

  const reactions = messages?.reactions[xmtpMessageId]

  // TODO: Add another fallback query to fetch single message reactions. Coming in the SDK later
  return {
    bySender: reactions?.bySender,
    byReactionContent: reactions?.byReactionContent,
  }
}
