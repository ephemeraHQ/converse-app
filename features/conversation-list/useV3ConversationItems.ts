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
  const { pinnedConversationTopics } = useChatStore(
    useSelect(["pinnedConversationTopics"])
  );
  const groups = useMemo(() => {
    const pinnedSet = new Set(pinnedConversationTopics);
    return data?.filter(
      (group) => group.state === "allowed" && !pinnedSet.has(group.topic)
    );
  }, [data, pinnedConversationTopics]);

  return { data: groups, ...rest };
};
