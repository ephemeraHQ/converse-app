import {
  SetDataOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";

import { groupPhotoQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";
import { useGroupQuery } from "./useGroupQuery";

export const useGroupPhotoQuery = (
  account: string,
  topic: string,
  queryOptions?: Partial<
    UseQueryOptions<string | undefined, Error, string | undefined>
  >
) => {
  const { data: group } = useGroupQuery(account, topic);
  return useQuery({
    queryKey: groupPhotoQueryKey(account, topic),
    queryFn: async () => {
      if (!group) {
        return;
      }
      return group.groupImageUrlSquare();
    },
    enabled: !!group,
    ...queryOptions,
  });
};

export const getGroupPhotoQueryData = (
  account: string,
  topic: string
): string | undefined =>
  queryClient.getQueryData(groupPhotoQueryKey(account, topic));

export const setGroupPhotoQueryData = (
  account: string,
  topic: string,
  groupPhoto: string,
  options?: SetDataOptions
) => {
  queryClient.setQueryData(
    groupPhotoQueryKey(account, topic),
    groupPhoto,
    options
  );
};

export const cancelGroupPhotoQuery = async (account: string, topic: string) => {
  await queryClient.cancelQueries({
    queryKey: groupPhotoQueryKey(account, topic),
  });
};

export const invalidateGroupPhotoQuery = async (
  account: string,
  topic: string
) => {
  return queryClient.invalidateQueries({
    queryKey: groupPhotoQueryKey(account, topic),
  });
};
