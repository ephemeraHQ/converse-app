import logger from "@/utils/logger";
import { ConversationWithCodecsType } from "@/utils/xmtpRN/client.types";
import { getConversationByTopicByAccount } from "@/utils/xmtpRN/conversations";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { cacheOnlyQueryOptions } from "./cacheOnlyQueryOptions";
import { queryClient } from "./queryClient";
import { conversationPreviewMessagesQueryKey } from "./QueryKeys";
import {
  ConversationMessagesQueryData,
  conversationMessagesQueryFn,
} from "./useConversationMessages";
import { useConversationQuery } from "./useConversationQuery";

const conversationPreviewMessagesQueryFn = async (
  conversation: ConversationWithCodecsType
) => {
  logger.info(
    "[ConversationPreview Messages]conversationPreviewMessagesQueryFn",
    {
      topic: conversation?.topic,
    }
  );
  const start = Date.now();
  const messages = await conversationMessagesQueryFn(conversation!, {
    limit: 10,
  });
  const end = Date.now();
  logger.info(
    "[ConversationPreview Messages]conversationPreviewMessagesQueryFn",
    {
      topic: conversation?.topic,
      duration: end - start,
      messages: messages.ids.length,
    }
  );
  return messages;
};

export const useConversationPreviewMessages = (
  account: string,
  topic: ConversationTopic,
  options?: Partial<UseQueryOptions<ConversationMessagesQueryData>>
) => {
  const { data: conversation } = useConversationQuery({
    account,
    topic,
    queryOptions: cacheOnlyQueryOptions,
  });

  return useQuery({
    queryKey: conversationPreviewMessagesQueryKey(account, topic),
    queryFn: () => conversationPreviewMessagesQueryFn(conversation!),
    enabled: !!conversation,
    ...options,
  });
};

export const prefetchConversationPreviewMessages = async (
  account: string,
  topic: ConversationTopic
) => {
  return queryClient.prefetchQuery({
    queryKey: conversationPreviewMessagesQueryKey(account, topic),
    queryFn: async () => {
      const conversation = await getConversationByTopicByAccount({
        account,
        topic,
      });
      return conversationPreviewMessagesQueryFn(conversation);
    },
  });
};
