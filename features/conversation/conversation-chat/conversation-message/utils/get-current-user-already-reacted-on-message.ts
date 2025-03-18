import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { getConversationMessagesQueryData } from "@/features/conversation/conversation-chat/conversation-messages.query"
import { IXmtpConversationId, IXmtpMessageId } from "@/features/xmtp/xmtp.types"

export function getCurrentUserAlreadyReactedOnMessage(args: {
  messageId: IXmtpMessageId
  xmtpConversationId: IXmtpConversationId
  emoji: string | undefined // Specific emoji or just reacted in general
}) {
  const { messageId, xmtpConversationId, emoji } = args

  const currentSender = getSafeCurrentSender()

  const messages = getConversationMessagesQueryData({
    clientInboxId: currentSender.inboxId,
    xmtpConversationId,
  })

  const reactions = messages?.reactions[messageId]
  const bySender = reactions?.bySender

  return bySender?.[currentSender.inboxId!]?.some(
    (reaction) => !emoji || reaction.content === emoji,
  )
}
