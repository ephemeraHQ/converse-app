import { useCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import { getConversationMetadataQueryOptions } from "@/features/conversation/conversation-metadata/conversation-metadata.query";
import { useQuery } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";

export function useConversationIsDeleted(args: {
  conversationTopic: ConversationTopic;
}) {
  const { conversationTopic } = args;

  const currentAccount = useCurrentAccount();

  const { data: isDeleted } = useQuery({
    ...getConversationMetadataQueryOptions({
      account: currentAccount!,
      topic: conversationTopic,
    }),
    select: (data) => data?.deleted,
  });

  return {
    isDeleted,
  };
}
