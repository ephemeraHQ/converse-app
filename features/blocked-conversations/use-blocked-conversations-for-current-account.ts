import { isConversationDenied } from "@/features/conversation/utils/is-conversation-denied";
import { getConversationMetadataQueryOptions } from "@/queries/conversation-metadata-query";
import { useConversationsQuery } from "@/queries/conversations-query";
import { useCurrentAccount } from "@data/store/accountsStore";
import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

export const useBlockedConversationsForCurrentAccount = () => {
  const currentAccount = useCurrentAccount();

  const { data } = useConversationsQuery({
    account: currentAccount!,
  });

  const conversationsMetadataQueries = useQueries({
    queries: (data ?? []).map((conversation) =>
      getConversationMetadataQueryOptions({
        account: currentAccount!,
        topic: conversation.topic,
      })
    ),
  });

  const blockedConversations = useMemo(() => {
    if (!data) return [];

    return data.filter((conversation, index) => {
      const query = conversationsMetadataQueries[index];
      return (
        // Include deleted conversations
        query?.data?.isDeleted ||
        // Include denied conversations
        isConversationDenied(conversation)
      );
    });
  }, [data, conversationsMetadataQueries]);

  return { data: blockedConversations };
};
