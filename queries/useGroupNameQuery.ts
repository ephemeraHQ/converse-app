import { useQuery } from "@tanstack/react-query";

import { groupNameQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";
import { useGroupQuery } from "./useGroupQuery";

export const useGroupNameQuery = (account: string, topic: string) => {
  const { data: group } = useGroupQuery(account, topic);
  return useQuery({
    queryKey: groupNameQueryKey(account, topic),
    queryFn: async () => {
      if (!group) {
        return;
      }
      return group.groupName();
    },
    enabled: !!group,
  });
};

export const getGroupNameQueryData = (
  account: string,
  topic: string
): string | undefined =>
  queryClient.getQueryData(groupNameQueryKey(account, topic));

export const setGroupNameQueryData = (
  account: string,
  topic: string,
  groupName: string
) => {
  queryClient.setQueryData(groupNameQueryKey(account, topic), groupName);
};

export const cancelGroupNameQuery = async (account: string, topic: string) => {
  await queryClient.cancelQueries({
    queryKey: groupNameQueryKey(account, topic),
  });
};
