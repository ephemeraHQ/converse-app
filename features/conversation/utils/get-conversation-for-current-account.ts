import { ConversationTopic } from "@xmtp/react-native-sdk"
import { getCurrentSenderEthAddress } from "@/features/authentication/multi-inbox.store"
import { getConversationQueryData } from "@/queries/conversation-query"

export function getConversationForCurrentAccount(topic: ConversationTopic) {
  const currentAccount = getCurrentSenderEthAddress()!
  return getConversationQueryData({
    account: currentAccount,
    topic: topic,
  })
}
