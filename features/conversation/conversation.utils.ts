import { getCurrentAccount } from "@/data/store/accountsStore";
import { getConversationQueryData } from "@/queries/useConversationQuery";
import { ConversationTopic, MessageId } from "@xmtp/react-native-sdk";

export function getCurrentAccountConversation(topic: ConversationTopic) {
  const currentAccount = getCurrentAccount()!;
  return getConversationQueryData({
    account: currentAccount,
    topic: topic,
  });
}
