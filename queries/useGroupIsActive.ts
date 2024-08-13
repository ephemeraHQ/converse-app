import { useQuery } from "@tanstack/react-query";

import { groupIsActiveQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";
import { useGroupQuery } from "./useGroupQuery";

export const useGroupIsActiveQuery = (account: string, topic: string) => {
  const { data: group, dataUpdatedAt } = useGroupQuery(account, topic);
  return useQuery({
    queryKey: groupIsActiveQueryKey(account, topic),
    queryFn: async () => {
      if (!group) {
        return;
      }
      return group.isActive();
    },
    enabled: !!group,
    initialData: group?.isGroupActive,
    initialDataUpdatedAt: dataUpdatedAt,
  });
};

export const getGroupIsActiveQueryData = (
  account: string,
  topic: string
): boolean | undefined =>
  queryClient.getQueryData(groupIsActiveQueryKey(account, topic));

export const setGroupIsActiveQueryData = (
  account: string,
  topic: string,
  isActive: boolean
) => {
  queryClient.setQueryData(groupIsActiveQueryKey(account, topic), isActive);
};

export const cancelGroupIsActiveQuery = async (
  account: string,
  topic: string
) => {
  await queryClient.cancelQueries({
    queryKey: groupIsActiveQueryKey(account, topic),
  });
};

export const invalidateGroupIsActiveQuery = async (
  account: string,
  topic: string
) => {
  return queryClient.invalidateQueries({
    queryKey: groupIsActiveQueryKey(account, topic),
  });
};
