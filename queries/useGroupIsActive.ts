import { useQuery } from "@tanstack/react-query";

import { groupIsActiveQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";
import { useGroupQuery } from "@queries/useGroupQuery";
import type { ConversationTopic } from "@xmtp/react-native-sdk";

export const useGroupIsActiveQuery = (
  account: string,
  topic: ConversationTopic
) => {
  const { data: group } = useGroupQuery(account, topic);
  return useQuery({
    queryKey: groupIsActiveQueryKey(account, topic),
    queryFn: async () => {
      if (!group) {
        return;
      }
      return group.isActive();
    },
    enabled: !!group,
  });
};

export const getGroupIsActiveQueryData = (
  account: string,
  topic: ConversationTopic
): boolean | undefined =>
  queryClient.getQueryData(groupIsActiveQueryKey(account, topic));

export const setGroupIsActiveQueryData = (
  account: string,
  topic: ConversationTopic,
  isActive: boolean
) => {
  queryClient.setQueryData(groupIsActiveQueryKey(account, topic), isActive);
};

export const cancelGroupIsActiveQuery = async (
  account: string,
  topic: ConversationTopic
) => {
  await queryClient.cancelQueries({
    queryKey: groupIsActiveQueryKey(account, topic),
  });
};

export const invalidateGroupIsActiveQuery = async (
  account: string,
  topic: ConversationTopic
) => {
  return queryClient.invalidateQueries({
    queryKey: groupIsActiveQueryKey(account, topic),
  });
};
