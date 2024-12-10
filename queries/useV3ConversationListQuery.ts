import { QueryKeys } from "@queries/QueryKeys";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import logger from "@utils/logger";
import {
  ConversationWithCodecsType,
  ConverseXmtpClientType,
  DecodedMessageWithCodecsType,
  GroupWithCodecsType,
} from "@utils/xmtpRN/client";
import { getXmtpClient } from "@utils/xmtpRN/sync";

import { queryClient } from "./queryClient";
import { setGroupIsActiveQueryData } from "./useGroupIsActive";
import { setGroupNameQueryData } from "./useGroupNameQuery";
import { setGroupPhotoQueryData } from "./useGroupPhotoQuery";
import { ConversationTopic, ConversationVersion } from "@xmtp/react-native-sdk";
import { useAppStore } from "@/data/store/appStore";

export const conversationListKey = (account: string) => [
  QueryKeys.V3_CONVERSATION_LIST,
  account?.toLowerCase(), // All queries are case sensitive, sometimes we use checksum, but the SDK use lowercase, always use lowercase
];

export type V3ConversationListType = ConversationWithCodecsType[];

const v3ConversationListQueryFn = async (
  account: string,
  context: string,
  includeSync: boolean = true
): Promise<V3ConversationListType> => {
  try {
    logger.debug(
      `[ConversationListQuery] Fetching conversation list from network ${context}`
    );
    const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
    const beforeSync = new Date().getTime();
    if (includeSync) {
      await client.conversations.sync();
      await client.conversations.syncAllConversations();
    }
    const afterSync = new Date().getTime();
    logger.debug(
      `[ConversationListQuery] Fetching conversation list from network took ${
        (afterSync - beforeSync) / 1000
      } sec`
    );
    const conversations = await client.conversations.list(
      {
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
        setGroupNameQueryData(account, conversation.topic, conversation.name);
        setGroupPhotoQueryData(
          account,
          conversation.topic,
          conversation.imageUrlSquare
        );
        setGroupIsActiveQueryData(
          account,
          conversation.topic,
          conversation.isGroupActive
        );
      }
    }
    return conversations;
  } catch (error) {
    logger.error(
      `[ConversationListQuery] Error fetching conversation list from network ${context}`,
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
    queryKey: conversationListKey(account),
    queryFn: () => v3ConversationListQueryFn(account, context ?? ""),
    enabled: !!account,
  });
};

export const fetchPersistedConversationListQuery = (account: string) => {
  return queryClient.fetchQuery({
    queryKey: conversationListKey(account),
    queryFn: () =>
      v3ConversationListQueryFn(
        account,
        "fetchPersistedConversationListQuery",
        false
      ),
  });
};

export const fetchConversationListQuery = (account: string) => {
  return queryClient.fetchQuery({
    queryKey: conversationListKey(account),
    queryFn: () =>
      v3ConversationListQueryFn(account, "fetchGroupsConversationListQuery"),
  });
};

export const prefetchConversationListQuery = (account: string) => {
  return queryClient.prefetchQuery({
    queryKey: conversationListKey(account),
    queryFn: () =>
      v3ConversationListQueryFn(account, "prefetchConversationListQuery"),
  });
};

export const invalidateGroupsConversationListQuery = (account: string) => {
  return queryClient.invalidateQueries({
    queryKey: conversationListKey(account),
  });
};

const getConversationListQueryData = (
  account: string
): V3ConversationListType | undefined => {
  return queryClient.getQueryData<V3ConversationListType>(
    conversationListKey(account)
  );
};

const setConversationListQueryData = (
  account: string,
  conversations: V3ConversationListType
) => {
  return queryClient.setQueryData<V3ConversationListType>(
    conversationListKey(account),
    conversations
  );
};

export const addConversationToConversationListQuery = (
  account: string,
  conversation: ConversationWithCodecsType
) => {
  const previousConversationsData = getConversationListQueryData(account);
  if (!previousConversationsData) {
    setConversationListQueryData(account, [conversation]);
    return;
  }
  setConversationListQueryData(account, [
    conversation,
    ...previousConversationsData,
  ]);
};

export const updateConversationDataToConversationListQuery = (
  account: string,
  topic: ConversationTopic,
  conversation: Partial<ConversationWithCodecsType>
) => {
  const previousConversationsData = getConversationListQueryData(account);

  if (!previousConversationsData) return;
  const newConversations: V3ConversationListType =
    previousConversationsData.map((c) => {
      if (c.topic === topic) {
        return {
          ...c,
          ...conversation,
        } as ConversationWithCodecsType;
      }
      return c;
    });
  setConversationListQueryData(account, newConversations);
};

export const updateMessageToConversationListQuery = (
  account: string,
  message: DecodedMessageWithCodecsType
) => {
  updateConversationDataToConversationListQuery(
    account,
    message.topic as ConversationTopic,
    {
      lastMessage: message,
    }
  );
};

type UpdateGroupMetadataToConversationListQueryParams = {
  account: string;
  topic: ConversationTopic;
  groupMetadata: Partial<GroupWithCodecsType>;
};

export const updateGroupMetadataToConversationListQuery = ({
  account,
  topic,
  groupMetadata,
}: UpdateGroupMetadataToConversationListQueryParams) => {
  const previousConversationsData = getConversationListQueryData(account);
  if (!previousConversationsData) return;
  const newConversations: V3ConversationListType =
    previousConversationsData.map((c) => {
      if (c.topic === topic && c.version === ConversationVersion.GROUP) {
        return {
          ...c,
          ...groupMetadata,
        } as GroupWithCodecsType;
      }
      return c;
    });
  setConversationListQueryData(account, newConversations);
};

type UpdateGroupImageToConversationListQueryParams = {
  account: string;
  topic: ConversationTopic;
  image: string;
};

export const updateGroupImageToConversationListQuery = ({
  account,
  topic,
  image,
}: UpdateGroupImageToConversationListQueryParams) => {
  return updateConversationDataToConversationListQuery(account, topic, {
    imageUrlSquare: image,
  });
};

type UpdateGroupNameToConversationListQueryParams = {
  account: string;
  topic: ConversationTopic;
  name: string;
};

export const updateGroupNameToConversationListQuery = ({
  account,
  topic,
  name,
}: UpdateGroupNameToConversationListQueryParams) => {
  return updateConversationDataToConversationListQuery(account, topic, {
    name,
  });
};

type UpdateGroupDescriptionToConversationListQueryParams = {
  account: string;
  topic: ConversationTopic;
  description: string;
};

export const updateGroupDescriptionToConversationListQuery = ({
  account,
  topic,
  description,
}: UpdateGroupDescriptionToConversationListQueryParams) => {
  return updateConversationDataToConversationListQuery(account, topic, {
    description,
  });
};
