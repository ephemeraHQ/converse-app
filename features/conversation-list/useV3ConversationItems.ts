import { useChatStore, useCurrentAccount } from "@data/store/accountsStore";
import { useSelect } from "@data/store/storeHelpers";
import { useGroupsConversationListQuery } from "@queries/useGroupsConversationListQuery";
import { useMemo } from "react";

export const useV3ConversationItems = () => {
  const currentAccount = useCurrentAccount();
  const { data, ...rest } = useGroupsConversationListQuery(currentAccount!);
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
