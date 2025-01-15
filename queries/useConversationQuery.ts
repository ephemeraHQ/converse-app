import { mutateObjectProperties } from "@/utils/mutate-object-properties";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { getConversationByTopicByAccount } from "@utils/xmtpRN/conversations";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { conversationQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";

export type ConversationQueryData = Awaited<ReturnType<typeof getConversation>>;

type IArgs = {
  account: string;
  topic: ConversationTopic;
  context: string;
};

function getConversation(args: IArgs) {
  const { account, topic } = args;
  return getConversationByTopicByAccount({
    account,
    topic,
    includeSync: true,
  });
}

export const useConversationQuery = (args: IArgs) => {
  return useQuery(getConversationQueryOptions(args));
};

export function getConversationQueryOptions(args: IArgs) {
  const { account, topic, context } = args;
  return queryOptions({
    queryKey: conversationQueryKey(account, topic),
    queryFn: () => getConversation({ account, topic, context }),
    enabled: !!topic,
  });
}

export const setConversationQueryData = (
  args: IArgs & {
    conversation: ConversationQueryData;
  }
) => {
  queryClient.setQueryData(
    getConversationQueryOptions(args).queryKey,
    args.conversation
  );
};

export function updateConversationQueryData(
  args: IArgs & { conversationUpdate: Partial<ConversationQueryData> }
) {
  const { conversationUpdate } = args;
  queryClient.setQueryData(
    getConversationQueryOptions(args).queryKey,
    (previousConversation) => {
      if (!previousConversation) {
        return undefined;
      }
      return mutateObjectProperties(previousConversation, conversationUpdate);
    }
  );
}

export function refetchConversationQuery(args: IArgs) {
  return queryClient.refetchQueries(getConversationQueryOptions(args));
}

export const getConversationQueryData = (args: IArgs) => {
  return queryClient.getQueryData(getConversationQueryOptions(args).queryKey);
};

export function getOrFetchConversation(args: IArgs) {
  const conversation = getConversationQueryData(args);
  if (conversation) {
    return Promise.resolve(conversation);
  }
  return queryClient.fetchQuery(getConversationQueryOptions(args));
}
