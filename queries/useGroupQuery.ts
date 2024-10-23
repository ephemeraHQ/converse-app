import { useQuery } from "@tanstack/react-query";
import { getGroupIdFromTopic, isGroupTopic } from "@utils/groupUtils/groupId";
import { ConverseXmtpClientType } from "@utils/xmtpRN/client";
import { getXmtpClient } from "@utils/xmtpRN/sync";
import { Group } from "@xmtp/react-native-sdk";

import { groupQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";

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
        getGroupIdFromTopic(topic)
      );

      return group;
    },
    enabled: isGroupTopic(topic),
  });
};

export const useGroupConversationScreenQuery = (
  account: string,
  topic: string
) => {
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
        getGroupIdFromTopic(topic)
      );
      await group?.sync();

      return group;
    },
    enabled: isGroupTopic(topic),
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
