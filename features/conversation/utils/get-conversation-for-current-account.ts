import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { getConversationQueryData } from "@/features/conversation/queries/conversation.query"
import { IConversationTopic } from "../conversation.types"

export function getConversationForCurrentAccount(topic: IConversationTopic) {
  return getConversationQueryData({
    inboxId: getSafeCurrentSender().inboxId,
    topic: topic,
  })
}
