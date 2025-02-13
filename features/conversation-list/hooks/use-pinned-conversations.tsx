import { getConversationMetadataQueryOptions } from "@/queries/conversation-metadata-query";
import { useAllowedConsentConversationsQuery } from "@/queries/conversations-allowed-consent-query";
import { useCurrentAccount } from "@/features/authentication/account.store";
import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

export function usePinnedConversations() {
  const currentAccount = useCurrentAccount();

  const { isLoading: isLoadingConversations, data: conversations } =
    useAllowedConsentConversationsQuery({
      account: currentAccount!,
      caller: "usePinnedConversations",
    });

  const conversationsDataQueries = useQueries({
    queries: (conversations ?? []).map((conversation) =>
      getConversationMetadataQueryOptions({
        account: currentAccount!,
        topic: conversation.topic,
      })
    ),
  });

  const pinnedConversations = useMemo(() => {
    return conversations?.filter((conversation, index) => {
      const query = conversationsDataQueries[index];
      return query?.data?.isPinned;
    });
  }, [conversations, conversationsDataQueries]);

  return {
    pinnedConversations,
    isLoading:
      isLoadingConversations ||
      conversationsDataQueries.some((q) => q.isLoading),
  };
}
