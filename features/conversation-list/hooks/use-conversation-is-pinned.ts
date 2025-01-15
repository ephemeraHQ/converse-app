import { useCurrentAccount } from "@/data/store/accountsStore";
import { getConversationDataQueryOptions } from "@/queries/conversation-data-query";
import { useQuery } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";

export function useConversationIsPinned(args: {
  conversationTopic: ConversationTopic;
}) {
  const { conversationTopic } = args;

  const currentAccount = useCurrentAccount();

  const { data: isPinned } = useQuery({
    ...getConversationDataQueryOptions({
      account: currentAccount!,
      topic: conversationTopic,
      context: "useConversationIsPinned",
    }),
    select: (data) => data?.isPinned,
  });

  return {
    isPinned,
  };
}
