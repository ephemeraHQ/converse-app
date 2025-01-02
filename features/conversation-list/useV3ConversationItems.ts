import { isConversationAllowed } from "@/features/conversation/utils/is-conversation-allowed";
import { useConversationListQuery } from "@/queries/useConversationListQuery";
import { useChatStore, useCurrentAccount } from "@data/store/accountsStore";
import { useSelect } from "@data/store/storeHelpers";
import { useMemo } from "react";

export const useV3ConversationItems = () => {
  const currentAccount = useCurrentAccount();

  const { data: conversations, ...rest } = useConversationListQuery({
    account: currentAccount!,
    queryOptions: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
    context: "useV3ConversationItems",
  });

  const { pinnedConversationTopics, topicsData } = useChatStore(
    useSelect(["pinnedConversationTopics", "topicsData"])
  );

  const conversationsFiltered = useMemo(() => {
    const pinnedTopics = new Set(pinnedConversationTopics);
    const deletedTopics = new Set(
      Object.entries(topicsData)
        .filter(([_, data]) => data?.status === "deleted")
        .map(([topic]) => topic)
    );

    return conversations?.filter((conversation) => {
      const isAllowed = isConversationAllowed(conversation);
      const isNotPinned = !pinnedTopics.has(conversation.topic);
      const isNotDeleted = !deletedTopics.has(conversation.topic);

      return isAllowed && isNotPinned && isNotDeleted;
    });
  }, [conversations, pinnedConversationTopics, topicsData]);

  return { data: conversationsFiltered, ...rest };
};
