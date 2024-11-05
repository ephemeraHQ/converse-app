import { QueryKeys } from "@queries/QueryKeys";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import logger from "@utils/logger";
import {
  ConverseXmtpClientType,
  DecodedMessageWithCodecsType,
  GroupWithCodecsType,
} from "@utils/xmtpRN/client";
import { getXmtpClient } from "@utils/xmtpRN/sync";

import { queryClient } from "./queryClient";
import { setGroupIsActiveQueryData } from "./useGroupIsActive";
import { setGroupNameQueryData } from "./useGroupNameQuery";
import { setGroupPhotoQueryData } from "./useGroupPhotoQuery";

export const groupConversationListKey = (account: string) => [
  QueryKeys.GROUP_CONVERSATION_LIST,
  account,
];

type GroupConversationListType = GroupWithCodecsType[];

const groupsQueryFn = async (account: string) => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  const beforeSync = new Date().getTime();
  await client.conversations.syncGroups();
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
  for (const group of groups) {
    setGroupNameQueryData(account, group.topic, group.name);
    setGroupPhotoQueryData(account, group.topic, group.imageUrlSquare);
    setGroupIsActiveQueryData(account, group.topic, group.isGroupActive);
  }
  return groups;
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
    setGroupsConversationListQueryData(account, [group]);
    return;
  }
  setGroupsConversationListQueryData(account, [group, ...previousGroupsData]);
};

export const updateMessageToGroupsConversationListQuery = (
  account: string,
  message: DecodedMessageWithCodecsType
) => {
  const previousGroupsData = getGroupsConversationListQueryData(account);
  if (!previousGroupsData) return;
  const group = previousGroupsData.find((g) => g.topic === message.topic);
  if (!group) return;
  const newGroups: GroupConversationListType = previousGroupsData.map(
    (g) => {
      if (g.topic === message.topic) {
        g.lastMessage = message;
        return g;
      }
      return g;
    }
    // g.topic === message.topic ? { ...g, lastMessage: message } : g
  );
  setGroupsConversationListQueryData(account, newGroups);
};
