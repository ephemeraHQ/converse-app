import { useQuery } from "@tanstack/react-query";
import { getXmtpClient } from "@utils/xmtpRN/sync";

import { groupsQueryKey } from "./QueryKeys";
import { entify, EntityObject } from "./entify";
import { queryClient } from "./queryClient";
import {
  ConverseXmtpClientType,
  GroupWithCodecsType,
} from "../utils/xmtpRN/client";

type GroupsRawData = GroupWithCodecsType[] | undefined;
type GroupMembersSelectData = EntityObject<GroupWithCodecsType, string>;

export const useGroupsQuery = (account: string) => {
  return useQuery<GroupMembersSelectData>({
    queryKey: groupsQueryKey(account),
    queryFn: async () => {
      const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
      if (!client) {
        return {
          byId: {},
          ids: [],
        };
      }
      await client.conversations.syncGroups();
      const groups = await client.conversations.listGroups();
      return entify(groups, (group) => group.topic);
    },
    enabled: !!account,
  });
};

export const invalidateGroupsQuery = (account: string) => {
  return queryClient.invalidateQueries({ queryKey: groupsQueryKey(account) });
};

const getGroupsQueryData = (account: string): GroupsRawData | undefined =>
  queryClient.getQueryData(groupsQueryKey(account));

const setGroupsQueryData = (account: string, groups: GroupsRawData) => {
  queryClient.setQueryData(groupsQueryKey(account), groups);
};

export const addGroupToGroupsQuery = (
  account: string,
  group: GroupWithCodecsType
) => {
  const previousGroups = getGroupsQueryData(account);
  if (!previousGroups) {
    return;
  }
  setGroupsQueryData(account, [...previousGroups, group]);
};
