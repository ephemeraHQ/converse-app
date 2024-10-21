import { QueryKeys } from "@queries/QueryKeys";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import logger from "@utils/logger";
import {
  ConverseXmtpClientType,
  GroupWithCodecsType,
} from "@utils/xmtpRN/client";
import { getXmtpClient } from "@utils/xmtpRN/sync";

import { entify, EntityObject } from "./entify";
import { queryClient } from "./queryClient";

export const groupConversationListKey = (account: string) => [
  QueryKeys.GROUP_CONVERSATION_LIST,
  account,
];

type GroupConversationListType = EntityObject<GroupWithCodecsType, string>;

const groupsQueryFn = async (account: string) => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  const beforeSync = new Date().getTime();
  await client.conversations.syncGroups();
  const afterSync = new Date().getTime();
  logger.debug(
    `[Groups] Fetching group list from network took ${
      (afterSync - beforeSync) / 1000
    } sec`
  );
  const groups = await client.conversations.listGroups(
    {
      members: false,
      creatorInboxId: true,
      isActive: true,
      addedByInboxId: true,
      name: true,
      imageUrlSquare: true,
      consentState: true,
      lastMessage: true,
    },
    "lastMessage"
  );
  return entify(groups, (group) => group.topic);
};

export const useGroupsConversationListQuery = (
  account: string,
  queryOptions?: Partial<UseQueryOptions<GroupConversationListType>>
) => {
  return useQuery<GroupConversationListType>({
    ...queryOptions,
    queryKey: groupConversationListKey(account),
    queryFn: () => groupsQueryFn(account),
    enabled: !!account,
  });
};

export const fetchGroupsConversationListQuery = (account: string) => {
  return queryClient.fetchQuery({
    queryKey: groupConversationListKey(account),
    queryFn: () => groupsQueryFn(account),
  });
};

export const invalidateGroupsConversationListQuery = (account: string) => {
  return queryClient.invalidateQueries({
    queryKey: groupConversationListKey(account),
  });
};

const getGroupsConversationListQueryData = (
  account: string
): GroupConversationListType | undefined => {
  return queryClient.getQueryData(groupConversationListKey(account));
};

const setGroupsConversationListQueryData = (
  account: string,
  groups: GroupConversationListType
) => {
  queryClient.setQueryData(groupConversationListKey(account), groups);
};

export const addGroupToGroupsConversationListQuery = (
  account: string,
  group: GroupWithCodecsType
) => {
  const previousGroupsData = getGroupsConversationListQueryData(account);
  if (!previousGroupsData) {
    return;
  }
  setGroupsConversationListQueryData(account, {
    byId: {
      ...previousGroupsData.byId,
      [group.topic]: group,
    },
    ids: [group.topic, ...previousGroupsData.ids],
  });
};
