import { getConversationMessagesQueryData } from "@/features/conversation/conversation-chat/conversation-messages.query"
import { IXmtpConversationId, IXmtpInboxId, IXmtpMessageId } from "@/features/xmtp/xmtp.types"

export function getMessageFromConversationSafe({
  messageId,
  xmtpConversationId,
  clientInboxId,
}: {
  messageId: IXmtpMessageId
  xmtpConversationId: IXmtpConversationId
  clientInboxId: IXmtpInboxId
}) {
  // First try in our local cache
  const messages = getConversationMessagesQueryData({
    clientInboxId,
    xmtpConversationId,
  })

  if (!messages) {
    throw new Error(`Couldn't get conversation messages`)
  }

  return messages.byId[messageId]
}
