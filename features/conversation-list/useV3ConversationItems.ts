import { useChatStore, useCurrentAccount } from "@data/store/accountsStore";
import { useSelect } from "@data/store/storeHelpers";
import { useV3ConversationListQuery } from "@queries/useV3ConversationListQuery";
import { useMemo } from "react";

export const useV3ConversationItems = () => {
  const currentAccount = useCurrentAccount();
  const { data, ...rest } = useV3ConversationListQuery(
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
  const groups = useMemo(() => {
    const pinnedSet = new Set(pinnedConversationTopics);
    const deletedTopicsSet = new Set();
    for (const topic in topicsData) {
      const topicData = topicsData[topic];
      if (topicData?.status === "deleted") {
        deletedTopicsSet.add(topic);
      }
    }
    return data?.filter(
      (group) =>
        group.state === "allowed" &&
        !pinnedSet.has(group.topic) &&
        !deletedTopicsSet.has(group.topic)
    );
  }, [data, pinnedConversationTopics, topicsData]);

  return { data: groups, ...rest };
};
