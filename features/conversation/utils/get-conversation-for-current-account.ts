import { getCurrentAccountEthAddress } from "@/features/authentication/account.store";
import { getConversationQueryData } from "@/queries/conversation-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";

export function getConversationForCurrentAccount(topic: ConversationTopic) {
  const currentAccount = getCurrentAccountEthAddress()!;
  return getConversationQueryData({
    account: currentAccount,
    topic: topic,
  });
}
