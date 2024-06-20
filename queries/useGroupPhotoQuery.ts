import { useQuery } from "@tanstack/react-query";

import { groupPhotoQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";
import { useGroupQuery } from "./useGroupQuery";

export const useGroupPhotoQuery = (account: string, topic: string) => {
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
  groupPhoto: string
) => {
  queryClient.setQueryData(groupPhotoQueryKey(account, topic), groupPhoto);
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
