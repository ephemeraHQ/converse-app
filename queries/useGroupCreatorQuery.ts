import { groupCreatorQueryKey } from "@/queries/QueryKeys";
import { useQuery } from "@tanstack/react-query";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { currentAccount } from "../data/store/accountsStore";
import { useGroupQuery } from "./useGroupQuery";

export const useGroupCreatorQuery = (topic: ConversationTopic) => {
  const inboxId = getCurrentInboxId();

  const { data: group } = useGroupQuery({ account, topic });

  return useQuery({
    queryKey: groupCreatorQueryKey(account, topic),
    queryFn: () => {
      if (!group) return null;
      return group.creatorInboxId();
    },
    enabled: !!topic && !!group,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
