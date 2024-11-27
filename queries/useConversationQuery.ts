import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { getConversationByTopicByAccount } from "@utils/xmtpRN/conversations";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { queryClient } from "./queryClient";
import { conversationQueryKey } from "./QueryKeys";

export type ConversationQueryData = Awaited<ReturnType<typeof getConversation>>;

function getConversation(account: string, topic: ConversationTopic) {
  return getConversationByTopicByAccount({
    account,
    topic,
    includeSync: false,
  });
}

export const useConversationQuery = (
  account: string,
  topic: ConversationTopic | undefined,
  options?: Partial<UseQueryOptions<ConversationQueryData | null | undefined>>
) => {
  return useQuery({
    ...options,
    queryKey: conversationQueryKey(account, topic!),
    queryFn: () => getConversation(account, topic!),
    enabled: !!topic,
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
  conversation: ConversationQueryData
) => {
  queryClient.setQueryData(conversationQueryKey(account, topic), conversation);
};

export function refetchConversationQuery(
  account: string,
  topic: ConversationTopic
) {
  return queryClient.refetchQueries({
    queryKey: conversationQueryKey(account, topic),
  });
}

export const getConversationQueryData = (
  account: string,
  topic: ConversationTopic
) =>
  queryClient.getQueryData<ConversationQueryData>(
    conversationQueryKey(account, topic)
  );
