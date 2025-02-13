import { useCurrentAccount } from "@/features/authentication/account.store";
import { getConversationMetadataQueryOptions } from "@/queries/conversation-metadata-query";
import { useQuery } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";

export function useConversationIsPinned(args: {
  conversationTopic: ConversationTopic;
}) {
  const { conversationTopic } = args;

  const currentAccount = useCurrentAccount();

  const { data: isPinned } = useQuery({
    ...getConversationMetadataQueryOptions({
      account: currentAccount!,
      topic: conversationTopic,
    }),
    select: (data) => data?.isPinned,
  });

  return {
    isPinned,
  };
}
