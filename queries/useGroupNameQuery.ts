import {
  SetDataOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";

import { groupNameQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";
import { useGroupQuery } from "./useGroupQuery";

export const useGroupNameQuery = (
  account: string,
  topic: string,
  queryOptions?: Partial<
    UseQueryOptions<string | undefined, Error, string | undefined>
  >
) => {
  const { data: group } = useGroupQuery(account, topic);
  return useQuery({
    queryKey: groupNameQueryKey(account, topic),
    queryFn: async () => {
      if (!group) {
        return;
      }
      return group.groupName();
    },
    enabled: !!group && !!account,
    ...queryOptions,
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
  groupName: string,
  options?: SetDataOptions
) => {
  queryClient.setQueryData(
    groupNameQueryKey(account, topic),
    groupName,
    options
  );
};

export const cancelGroupNameQuery = async (account: string, topic: string) => {
  await queryClient.cancelQueries({
    queryKey: groupNameQueryKey(account, topic),
  });
};

export const invalidateGroupNameQuery = async (
  account: string,
  topic: string
) => {
  return queryClient.invalidateQueries({
    queryKey: groupNameQueryKey(account, topic),
  });
};
