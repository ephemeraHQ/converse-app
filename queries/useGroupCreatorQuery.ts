import { groupCreatorQueryKey } from "@/queries/QueryKeys";
import { useQuery, queryOptions } from "@tanstack/react-query";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { currentAccount } from "../data/store/accountsStore";
import { getGroupQueryData } from "./useGroupQuery";

const getGroupCreatorQueryOptions = (args: {
  account: string;
  topic: ConversationTopic;
}) => {
  const { account, topic } = args;
  return queryOptions({
    queryKey: groupCreatorQueryKey(account, topic),
    queryFn: () => {
      const group = getGroupQueryData({ account, topic });
      if (!group) return null;
      return group.creatorInboxId();
    },
    enabled: !!account && !!topic,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useGroupCreatorQuery = (topic: ConversationTopic) => {
  const account = currentAccount();

  return useQuery(getGroupCreatorQueryOptions({ account, topic }));
};
