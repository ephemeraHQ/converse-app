import { QueryKeys } from "@queries/QueryKeys";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import logger from "@utils/logger";
import {
  ConversationContainerWithCodecsType,
  ConverseXmtpClientType,
  DecodedMessageWithCodecsType,
  GroupWithCodecsType,
} from "@utils/xmtpRN/client";
import { getXmtpClient } from "@utils/xmtpRN/sync";

import { queryClient } from "./queryClient";
import { setGroupIsActiveQueryData } from "./useGroupIsActive";
import { setGroupNameQueryData } from "./useGroupNameQuery";
import { setGroupPhotoQueryData } from "./useGroupPhotoQuery";
import { ConversationVersion } from "@xmtp/react-native-sdk";

export const groupConversationListKey = (account: string) => [
  QueryKeys.V3_CONVERSATION_LIST,
  account,
];

type V3ConversationListType = ConversationContainerWithCodecsType[];

const v3ConversationListQueryFn = async (account: string, context: string) => {
  try {
    logger.debug(
      `[ConversationListQuery] Fetching group list from network ${context}`
    );
    const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
    const beforeSync = new Date().getTime();
    await client.conversations.syncGroups();
    await client.conversations.syncAllGroups();
    const afterSync = new Date().getTime();
    logger.debug(
      `[Groups] Fetching group list from network took ${
        (afterSync - beforeSync) / 1000
      } sec`
    );
    const conversations = await client.conversations.listGroups(
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
    for (const conversation of conversations) {
      if (conversation.version === ConversationVersion.GROUP) {
        const group = conversation as GroupWithCodecsType;
        setGroupNameQueryData(account, group.topic, group.name);
        setGroupPhotoQueryData(account, group.topic, group.imageUrlSquare);
        setGroupIsActiveQueryData(account, group.topic, group.isGroupActive);
      }
    }
    return conversations;
  } catch (error) {
    logger.error(
      `[ConversationListQuery] Error fetching group list from network ${context}`,
      error
    );
    throw error;
  }
};

export const useV3ConversationListQuery = (
  account: string,
  queryOptions?: Partial<UseQueryOptions<V3ConversationListType>>,
  context?: string
) => {
  return useQuery<V3ConversationListType>({
    staleTime: 2000,
    ...queryOptions,
    queryKey: groupConversationListKey(account),
    queryFn: () => v3ConversationListQueryFn(account, context ?? ""),
    enabled: !!account,
  });
};

export const fetchGroupsConversationListQuery = (account: string) => {
  return queryClient.fetchQuery({
    queryKey: groupConversationListKey(account),
    queryFn: () =>
      v3ConversationListQueryFn(account, "fetchGroupsConversationListQuery"),
  });
};

export const invalidateGroupsConversationListQuery = (account: string) => {
  return queryClient.invalidateQueries({
    queryKey: groupConversationListKey(account),
  });
};

const getGroupsConversationListQueryData = (
  account: string
): V3ConversationListType | undefined => {
  return queryClient.getQueryData(groupConversationListKey(account));
};

const setGroupsConversationListQueryData = (
  account: string,
  groups: V3ConversationListType
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
  const newGroups: V3ConversationListType = previousGroupsData.map((g) => {
    if (g.topic === message.topic) {
      g.lastMessage = message;
      return g;
    }
    return g;
  });
  setGroupsConversationListQueryData(account, newGroups);
};
