import {
  SetDataOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";

import { groupNameQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";
import { useConversationScreenQuery } from "./useConversationQuery";
import { ConversationTopic, ConversationVersion } from "@xmtp/react-native-sdk";

export const useGroupNameQuery = (
  account: string,
  topic: ConversationTopic,
  queryOptions?: Partial<UseQueryOptions<string | null, Error, string | null>>
) => {
  const { data: conversation } = useConversationScreenQuery(account, topic);
  return useQuery({
    queryKey: groupNameQueryKey(account, topic),
    queryFn: async () => {
      if (!conversation || conversation.version !== ConversationVersion.GROUP) {
        return null;
      }
      return conversation.groupName();
    },
    enabled:
      !!conversation &&
      conversation.version === ConversationVersion.GROUP &&
      !!account,
    ...queryOptions,
  });
};

export const getGroupNameQueryData = (
  account: string,
  topic: ConversationTopic
): string | undefined =>
  queryClient.getQueryData(groupNameQueryKey(account, topic));

export const setGroupNameQueryData = (
  account: string,
  topic: ConversationTopic,
  groupName: string,
  options?: SetDataOptions
) => {
  queryClient.setQueryData(
    groupNameQueryKey(account, topic),
    groupName,
    options
  );
};

export const cancelGroupNameQuery = async (
  account: string,
  topic: ConversationTopic
) => {
  await queryClient.cancelQueries({
    queryKey: groupNameQueryKey(account, topic),
  });
};

export const invalidateGroupNameQuery = async (
  account: string,
  topic: ConversationTopic
) => {
  return queryClient.invalidateQueries({
    queryKey: groupNameQueryKey(account, topic),
  });
};
