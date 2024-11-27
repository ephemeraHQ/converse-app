import { useQuery } from "@tanstack/react-query";
import { getCleanAddress } from "@utils/evm/address";
import { getGroupIdFromTopic, isGroupTopic } from "@utils/groupUtils/groupId";
import {
  ConverseXmtpClientType,
  xmtpClientByAccount,
} from "@utils/xmtpRN/client";
import { getXmtpClient } from "@utils/xmtpRN/sync";
import { Group } from "@xmtp/react-native-sdk";

import { groupQueryKey } from "./QueryKeys";
import { entifyWithAddress } from "./entify";
import { queryClient } from "./queryClient";
import { setGroupMembersQueryData } from "./useGroupMembersQuery";
import { setGroupNameQueryData } from "./useGroupNameQuery";
import { setGroupPhotoQueryData } from "./useGroupPhotoQuery";
import { useGroupsQuery } from "./useGroupsQuery";

export const useGroupQuery = (account: string, topic: string) => {
  const { data, dataUpdatedAt } = useGroupsQuery(account);
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
      let groupDataUpdatedAt = dataUpdatedAt;
      if (!group) {
        group = await client?.conversations.findGroup(
          getGroupIdFromTopic(topic)
        );
        groupDataUpdatedAt = new Date().getTime();
        if (!group) {
          return null;
        }
      }
      // We'll pre-cache some queries since we know
      // how old is our current group instance
      setGroupNameQueryData(account, topic, group.name, {
        updatedAt: groupDataUpdatedAt,
      });
      setGroupPhotoQueryData(account, topic, group.imageUrlSquare, {
        updatedAt: groupDataUpdatedAt,
      });
      const members = await group.members();
      setGroupMembersQueryData(
        account,
        topic,
        entifyWithAddress(
          members,
          (member) => member.inboxId,
          // TODO: Multiple addresses support
          (member) => getCleanAddress(member.addresses[0])
        ),
        {
          updatedAt: groupDataUpdatedAt,
        }
      );
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

export const setGroupQueryData = (
  account: string,
  topic: string,
  group: Group
) => {
  queryClient.setQueryData(groupQueryKey(account, topic), group);
};
