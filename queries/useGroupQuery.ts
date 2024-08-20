import { useQuery } from "@tanstack/react-query";
import { getGroupIdFromTopic, isGroupTopic } from "@utils/groupUtils/groupId";
import {
  ConverseXmtpClientType,
  xmtpClientByAccount,
} from "@utils/xmtpRN/client";
import { getXmtpClient } from "@utils/xmtpRN/sync";
import { Group } from "@xmtp/react-native-sdk";

import { groupQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";
import { useGroupsQuery } from "./useGroupsQuery";

export const useGroupQuery = (account: string, topic: string) => {
  const { data } = useGroupsQuery(account);
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
      let group = data?.byId[topic];
      if (!group) {
        group = await client?.conversations.findGroup(
          getGroupIdFromTopic(topic)
        );
        if (!group) {
          return null;
        }
      }
      return group;
    },
    enabled: !!data && isGroupTopic(topic),
    select: (data) => {
      if (!data) {
        return null;
      }
      if (data instanceof Group) {
        return data;
      }
      const client = xmtpClientByAccount[account];
      if (!client) {
        return null;
      }
      // Recreate the group object with the client
      return new Group(client!, data, (data as any)?.members);
    },
  });
};

export const invalidateGroupQuery = (account: string, topic: string) => {
  queryClient.invalidateQueries({
    queryKey: groupQueryKey(account, topic),
  });
};
