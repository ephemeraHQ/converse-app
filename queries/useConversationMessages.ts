import { useQuery, UseQueryOptions } from "@tanstack/react-query";

import logger from "@utils/logger";
import {
  ConversationWithCodecsType,
  DecodedMessageWithCodecsType,
} from "@utils/xmtpRN/client";
import { getConversationByTopicByAccount } from "@utils/xmtpRN/conversations";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { cacheOnlyQueryOptions } from "./cacheOnlyQueryOptions";
import { entify, EntityObject } from "./entify";
import { queryClient } from "./queryClient";
import { conversationMessagesQueryKey } from "./QueryKeys";
import { useConversationQuery } from "./useConversationQuery";
import { useRefreshOnFocus } from "./useRefreshOnFocus";

export type EntifiedMessagesType = EntityObject<DecodedMessageWithCodecsType>;

const conversationMessagesQueryFn = async (
  conversation: ConversationWithCodecsType
) => {
  logger.info("[useConversationMessages] queryFn fetching messages");
  if (!conversation) {
    return {
      ids: [],
      byId: {},
    };
  }
  const messages = await conversation.messages();
  return entify(messages, (message) => message.id);
};

const conversationMessagesByTopicQueryFn = async (
  account: string,
  topic: ConversationTopic
) => {
  logger.info("[useConversationMessages] queryFn fetching messages by topic");
  const conversation = await getConversationByTopicByAccount({
    account,
    topic,
  });
  return conversationMessagesQueryFn(conversation!);
};

export const useConversationMessages = (
  account: string,
  topic: ConversationTopic,
  options?: Partial<UseQueryOptions<EntifiedMessagesType>>
) => {
  const { data: conversation } = useConversationQuery(
    account,
    topic,
    cacheOnlyQueryOptions
  );

  const queryData = useQuery({
    queryKey: conversationMessagesQueryKey(account, topic),
    queryFn: async () => {
      return conversationMessagesQueryFn(conversation!);
    },
    enabled: !!conversation,
    ...options,
  });
  useRefreshOnFocus(async (): Promise<void> => {
    if (options?.refetchOnWindowFocus) {
      await queryData.refetch();
    }
  });

  return queryData;
};

export const getConversationMessages = (
  account: string,
  topic: ConversationTopic
) => {
  return queryClient.getQueryData<EntifiedMessagesType>(
    conversationMessagesQueryKey(account, topic)
  );
};

const setConversationMessages = (
  account: string,
  topic: ConversationTopic,
  messages: EntifiedMessagesType
) => {
  queryClient.setQueryData(
    conversationMessagesQueryKey(account, topic),
    messages
  );
};

export const addConversationMessage = (
  account: string,
  topic: ConversationTopic,
  message: DecodedMessageWithCodecsType
) => {
  const previousMessages = getConversationMessages(account, topic);
  if (!previousMessages) {
    setConversationMessages(account, topic, {
      ids: [message.id],
      byId: { [message.id]: message },
    });
    return;
  }
  previousMessages.byId[message.id] = message;
  setConversationMessages(account, topic, {
    ids: [message.id, ...previousMessages.ids],
    byId: previousMessages.byId,
  });
};

export const prefetchConversationMessages = (
  account: string,
  topic: ConversationTopic
) => {
  queryClient.prefetchQuery({
    queryKey: conversationMessagesQueryKey(account.toLowerCase(), topic),
    queryFn: () => {
      logger.info("[prefetchConversationMessages] prefetching messages");
      return conversationMessagesByTopicQueryFn(account, topic);
    },
  });
};
