import { useCurrentAccount } from "@/data/store/accountsStore";
import { isConversationAllowed } from "@/features/conversation/utils/is-conversation-allowed";
import { getConversationMetadataQueryOptions } from "@/queries/conversation-metadata-query";
import { getConversationsQueryOptions } from "@/queries/conversations-query";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export const useConversationListConversations = () => {
  const currentAccount = useCurrentAccount();

  const { data: conversations, ...rest } = useQuery(
    getConversationsQueryOptions({
      account: currentAccount!,
    })
  );

  const conversationsDataQueries = useQueries({
    queries: (conversations ?? []).map((conversation) =>
      getConversationMetadataQueryOptions({
        account: currentAccount!,
        topic: conversation.topic,
      })
    ),
  });

  const conversationsFiltered = useMemo(() => {
    if (!conversations) return [];

    return conversations.filter((conversation, index) => {
      const query = conversationsDataQueries[index];
      return (
        // Check if conversation is allowed based on permissions
        isConversationAllowed(conversation) &&
        // Exclude pinned conversations
        !query?.data?.isPinned &&
        // Exclude deleted conversations
        !query?.data?.isDeleted &&
        // Only include conversations that have finished loading
        !query?.isLoading
      );
    });
  }, [conversations, conversationsDataQueries]);

  return { data: conversationsFiltered, ...rest };
};
