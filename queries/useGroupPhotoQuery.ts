import {
  SetDataOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";

import { groupPhotoQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";
import { useGroupQuery } from "./useGroupQuery";
import type { ConversationTopic } from "@xmtp/react-native-sdk";

export const useGroupPhotoQuery = (
  account: string,
  topic: ConversationTopic,
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
  topic: ConversationTopic
): string | undefined =>
  queryClient.getQueryData(groupPhotoQueryKey(account, topic));

export const setGroupPhotoQueryData = (
  account: string,
  topic: ConversationTopic,
  groupPhoto: string,
  options?: SetDataOptions
) => {
  queryClient.setQueryData(
    groupPhotoQueryKey(account, topic),
    groupPhoto,
    options
  );
};

export const cancelGroupPhotoQuery = async (
  account: string,
  topic: ConversationTopic
) => {
  await queryClient.cancelQueries({
    queryKey: groupPhotoQueryKey(account, topic),
  });
};

export const invalidateGroupPhotoQuery = async (
  account: string,
  topic: ConversationTopic
) => {
  return queryClient.invalidateQueries({
    queryKey: groupPhotoQueryKey(account, topic),
  });
};
