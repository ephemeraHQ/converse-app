import { useCurrentAccount } from "@/data/store/accountsStore";
import { useConversationDataQuery } from "@/queries/use-conversation-data-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";

export function useConversationIsPinned(args: {
  conversationTopic: ConversationTopic;
}) {
  const { conversationTopic } = args;

  const currentAccount = useCurrentAccount();

  const { data } = useConversationDataQuery({
    account: currentAccount!,
    topic: conversationTopic,
  });

  return {
    isPinned: data?.isPinned,
  };
}
