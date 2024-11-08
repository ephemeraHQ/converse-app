import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { getV3IdFromTopic, isV3Topic } from "@utils/groupUtils/groupId";
import {
  ConverseXmtpClientType,
  GroupWithCodecsType,
} from "@utils/xmtpRN/client";
import { getXmtpClient } from "@utils/xmtpRN/sync";
import { Group } from "@xmtp/react-native-sdk";

import { groupQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";
import logger from "@utils/logger";

export const useGroupQuery = (account: string, topic: string) => {
  return useQuery({
    queryKey: groupQueryKey(account, topic),
    queryFn: async () => {
      if (!topic) {
        return null;
      }
      const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
      if (!client) {
        return null;
      }
      const group = await client.conversations.findGroup(
        getV3IdFromTopic(topic)
      );

      return group;
    },
    enabled: isV3Topic(topic),
  });
};

export const useGroupConversationScreenQuery = (
  account: string,
  topic: string,
  options?: Partial<UseQueryOptions<GroupWithCodecsType | null | undefined>>
) => {
  return useQuery({
    ...options,
    queryKey: groupQueryKey(account, topic),
    queryFn: async () => {
      logger.info("[Crash Debug] queryFn fetching group");
      if (!topic) {
        return null;
      }
      const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
      if (!client) {
        return null;
      }
      const group = await client.conversations.findGroup(
        getV3IdFromTopic(topic)
      );
      await group?.sync();

      return group;
    },
    enabled: isV3Topic(topic),
  });
};

export const invalidateGroupQuery = (account: string, topic: string) => {
  queryClient.invalidateQueries({
    queryKey: groupQueryKey(account, topic),
  });
};

export const setGroupQueryData = (
  account: string,
  topic: string,
  group: Group
) => {
  queryClient.setQueryData(groupQueryKey(account, topic), group);
};
