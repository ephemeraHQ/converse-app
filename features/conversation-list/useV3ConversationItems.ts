import { isConversationAllowed } from "@/features/conversation/utils/isConversationAllowed";
import { useChatStore, useCurrentAccount } from "@data/store/accountsStore";
import { useSelect } from "@data/store/storeHelpers";
import { useV3ConversationListQuery } from "@queries/useV3ConversationListQuery";
import { useMemo } from "react";

export const useV3ConversationItems = () => {
  const currentAccount = useCurrentAccount();

  const { data: conversations, ...rest } = useV3ConversationListQuery(
    currentAccount!,
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
    "useV3ConversationItems"
  );

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
