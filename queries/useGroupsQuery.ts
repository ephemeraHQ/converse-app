import { useQuery } from "@tanstack/react-query";

import { groupsQueryKey } from "./QueryKeys";
import { entify, EntityObject } from "./entify";
import { queryClient } from "./queryClient";
import { useClient } from "./useClient";
import { GroupWithCodecsType } from "../utils/xmtpRN/client";

type GroupsRawData = GroupWithCodecsType[] | undefined;
type GroupMembersSelectData = EntityObject<GroupWithCodecsType, string>;

export const useGroupsQuery = (account: string) => {
  const client = useClient(account);

  return useQuery<GroupsRawData, unknown, GroupMembersSelectData>({
    queryKey: groupsQueryKey(account),
    queryFn: async () => {
      if (!client) {
        return;
      }
      await client.conversations.syncGroups();
      const groups = await client.conversations.listGroups();
      return groups;
    },
    enabled: !!client,
    select: (data): EntityObject<GroupWithCodecsType> => {
      if (!data) {
        return {
          byId: {},
          ids: [],
        };
      }
      return entify(data, (group) => group.topic);
    },
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
