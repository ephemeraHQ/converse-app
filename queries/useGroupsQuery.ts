import { useQuery } from "@tanstack/react-query";
import logger from "@utils/logger";
import { getXmtpClient } from "@utils/xmtpRN/sync";

import { groupsQueryKey } from "./QueryKeys";
import { entify, EntityObject } from "./entify";
import { queryClient } from "./queryClient";
import {
  ConverseXmtpClientType,
  GroupWithCodecsType,
} from "../utils/xmtpRN/client";

type GroupMembersSelectData = EntityObject<GroupWithCodecsType, string>;

const groupsQueryFn = async (account: string) => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  if (!client) {
    return {
      byId: {},
      ids: [],
    };
  }
  const beforeSync = new Date().getTime();
  await client.conversations.syncGroups();
  const afterSync = new Date().getTime();
  logger.debug(
    `[Groups] Fetching group list from network took ${
      (afterSync - beforeSync) / 1000
    } sec`
  );
  const groups = await client.conversations.listGroups();
  const afterList = new Date().getTime();
  logger.debug(
    `[Groups] Listing ${groups.length} groups took ${
      (afterList - afterSync) / 1000
    } sec`
  );
  return entify(groups, (group) => group.topic);
};

export const useGroupsQuery = (account: string) => {
  return useQuery<GroupMembersSelectData>({
    queryKey: groupsQueryKey(account),
    queryFn: () => groupsQueryFn(account),
    enabled: !!account,
  });
};

export const fetchGroupsQuery = (account: string, staleTime?: number) => {
  return queryClient.fetchQuery({
    queryKey: groupsQueryKey(account),
    queryFn: () => groupsQueryFn(account),
    staleTime,
  });
};

export const invalidateGroupsQuery = (account: string) => {
  return queryClient.invalidateQueries({ queryKey: groupsQueryKey(account) });
};

const getGroupsQueryData = (
  account: string
): GroupMembersSelectData | undefined =>
  queryClient.getQueryData(groupsQueryKey(account));

const setGroupsQueryData = (
  account: string,
  groups: GroupMembersSelectData
) => {
  queryClient.setQueryData(groupsQueryKey(account), groups);
};

export const addGroupToGroupsQuery = (
  account: string,
  group: GroupWithCodecsType
) => {
  const previousGroupsData = getGroupsQueryData(account);
  if (!previousGroupsData) {
    return;
  }

  setGroupsQueryData(account, {
    byId: {
      ...previousGroupsData.byId,
      [group.topic]: group,
    },
    ids: [...previousGroupsData.ids, group.topic],
  });
};
