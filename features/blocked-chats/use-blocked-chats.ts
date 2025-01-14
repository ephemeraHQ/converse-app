import { getConversationDataQueryOptions } from "@/queries/use-conversation-data-query";
import { useConversationListQuery } from "@/queries/useConversationListQuery";
import { useCurrentAccount } from "@data/store/accountsStore";
import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

export const useBlockedChats = () => {
  const currentAccount = useCurrentAccount();

  const { data } = useConversationListQuery({
    account: currentAccount!,
    context: "useBlockedChats",
  });

  const conversationsDataQueries = useQueries({
    queries: (data ?? []).map((conversation) =>
      getConversationDataQueryOptions({
        account: currentAccount!,
        topic: conversation.topic,
        context: "useBlockedChats",
      })
    ),
  });

  const blockedConversations = useMemo(() => {
    if (!data) return [];

    return data.filter((conversation, index) => {
      const query = conversationsDataQueries[index];
      return (
        // Include deleted conversations
        query?.data?.isDeleted ||
        // Include denied conversations
        conversation.state === "denied"
      );
    });
  }, [data, conversationsDataQueries]);

  return { data: blockedConversations };
};
