import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { isV3Topic } from "@utils/groupUtils/groupId";
import {
  ConversationWithCodecsType,
  ConverseXmtpClientType,
} from "@utils/xmtpRN/client";
import { getXmtpClient } from "@utils/xmtpRN/sync";
import type { ConversationTopic } from "@xmtp/react-native-sdk";

import { conversationQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";
import logger from "@utils/logger";
import { getConversationByTopicByAccount } from "@utils/xmtpRN/conversations";

export const useConversationQuery = (
  account: string,
  topic: ConversationTopic,
  options?: Partial<
    UseQueryOptions<ConversationWithCodecsType | null | undefined>
  >
) => {
  return useQuery({
    ...options,
    queryKey: conversationQueryKey(account, topic),
    queryFn: async () => {
      if (!topic) {
        return null;
      }
      return getConversationByTopicByAccount({
        account,
        topic,
        includeSync: false,
      });
    },
    enabled: !!topic,
  });
};

export const useConversationScreenQuery = (
  account: string,
  topic: ConversationTopic,
  options?: Partial<
    UseQueryOptions<ConversationWithCodecsType | null | undefined>
  >
) => {
  return useQuery({
    ...options,
    queryKey: conversationQueryKey(account, topic),
    queryFn: async () => {
      logger.info("[Crash Debug] queryFn fetching group");
      if (!topic) {
        return null;
      }
      const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
      if (!client) {
        return null;
      }
      const conversation =
        await client.conversations.findConversationByTopic(topic);
      await conversation?.sync();

      return conversation;
    },
    enabled: isV3Topic(topic),
  });
};

export const invalidateConversationQuery = (
  account: string,
  topic: ConversationTopic
) => {
  queryClient.invalidateQueries({
    queryKey: conversationQueryKey(account, topic),
  });
};

export const setConversationQueryData = (
  account: string,
  topic: ConversationTopic,
  conversation: ConversationWithCodecsType
) => {
  queryClient.setQueryData(conversationQueryKey(account, topic), conversation);
};
