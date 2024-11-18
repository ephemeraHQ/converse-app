import { useQuery } from "@tanstack/react-query";

import { groupDescriptionQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";
import { useGroupQuery } from "@queries/useGroupQuery";
import type { ConversationTopic } from "@xmtp/react-native-sdk";

export const useGroupDescriptionQuery = (
  account: string,
  topic: ConversationTopic
) => {
  const { data: group } = useGroupQuery(account, topic);
  return useQuery({
    queryKey: groupDescriptionQueryKey(account, topic),
    queryFn: async () => {
      if (!group) {
        return;
      }
      return group.groupDescription();
    },
    enabled: !!group,
  });
};

export const getGroupDescriptionQueryData = (
  account: string,
  topic: ConversationTopic
): string | undefined =>
  queryClient.getQueryData(groupDescriptionQueryKey(account, topic));

export const setGroupDescriptionQueryData = (
  account: string,
  topic: ConversationTopic,
  groupDescription: string
) => {
  queryClient.setQueryData(
    groupDescriptionQueryKey(account, topic),
    groupDescription
  );
};

export const cancelGroupDescriptionQuery = async (
  account: string,
  topic: ConversationTopic
) => {
  await queryClient.cancelQueries({
    queryKey: groupDescriptionQueryKey(account, topic),
  });
};

export const invalidateGroupDescriptionQuery = async (
  account: string,
  topic: ConversationTopic
) => {
  return queryClient.invalidateQueries({
    queryKey: groupDescriptionQueryKey(account, topic),
  });
};
