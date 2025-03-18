import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { getConversationMessagesQueryData } from "@/features/conversation/conversation-chat/conversation-messages.query"
import { IXmtpConversationId, IXmtpMessageId } from "@/features/xmtp/xmtp.types"

export function getConversationPreviousMessage(args: {
  messageId: IXmtpMessageId
  xmtpConversationId: IXmtpConversationId
}) {
  const { messageId, xmtpConversationId } = args
  const currentSender = getSafeCurrentSender()
  const messages = getConversationMessagesQueryData({
    clientInboxId: currentSender.inboxId,
    xmtpConversationId,
  })
  if (!messages?.ids.includes(messageId)) {
    return undefined
  }
  const currentIndex = messages.ids.indexOf(messageId)
  const previousMessageId = messages.ids[currentIndex + 1]
  return previousMessageId ? messages.byId[previousMessageId] : undefined
}
