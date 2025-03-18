import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { getConversationQueryData } from "@/features/conversation/queries/conversation.query"
import { IXmtpConversationId } from "@/features/xmtp/xmtp.types"

export function getConversationForCurrentAccount(xmtpConversationId: IXmtpConversationId) {
  return getConversationQueryData({
    clientInboxId: getSafeCurrentSender().inboxId,
    xmtpConversationId,
  })
}
