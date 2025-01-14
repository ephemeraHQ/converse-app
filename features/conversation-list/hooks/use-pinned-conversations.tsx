import { getConversationDataQueryOptions } from "@/queries/conversation-data-query";
import { useConversationsQuery } from "@/queries/conversations-query";
import { useCurrentAccount } from "@data/store/accountsStore";
import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

export function usePinnedConversations() {
  const currentAccount = useCurrentAccount();

  const { isLoading: isLoadingConversations, data: conversations } =
    useConversationsQuery({
      account: currentAccount!,
      context: "PinnedConversations",
    });

  const conversationsDataQueries = useQueries({
    queries: (conversations ?? []).map((conversation) =>
      getConversationDataQueryOptions({
        account: currentAccount!,
        topic: conversation.topic,
        context: "usePinnedConversations",
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
