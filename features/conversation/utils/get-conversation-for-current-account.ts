import { IXmtpConversationTopic } from "@features/xmtp/xmtp.types"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { getConversationQueryData } from "@/features/conversation/queries/conversation.query"

export function getConversationForCurrentAccount(topic: IXmtpConversationTopic) {
  return getConversationQueryData({
    inboxId: getSafeCurrentSender().inboxId,
    topic: topic,
  })
}
