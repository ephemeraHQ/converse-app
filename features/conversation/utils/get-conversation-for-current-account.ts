import { getCurrentAccount } from "@/data/store/accountsStore";
import { getConversationQueryData } from "@/queries/conversation-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";

export function getConversationForCurrentAccount(topic: ConversationTopic) {
  const currentAccount = getCurrentAccount()!;
  return getConversationQueryData({
    account: currentAccount,
    topic: topic,
  });
}
