import logger from "@/utils/logger";
import { updateObjectAndMethods } from "@/utils/update-object-and-methods";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { getConversationByTopicByAccount } from "@utils/xmtpRN/conversations";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { conversationQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";

export type ConversationQueryData = Awaited<ReturnType<typeof getConversation>>;

type IArgs = {
  account: string;
  topic: ConversationTopic;
};

function getConversation(args: IArgs) {
  const { account, topic } = args;
  logger.debug(
    `[useConversationQuery] Fetching conversation for ${args.topic} with account ${args.account}`
  );
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
  const { account, topic } = args;
  return queryOptions({
    queryKey: conversationQueryKey(account, topic),
    queryFn: () => getConversation({ account, topic }),
    enabled: !!topic && !!account,
  });
}

export const setConversationQueryData = (
  args: IArgs & {
    conversation: ConversationQueryData;
  }
) => {
  const { account, topic, conversation } = args;
  queryClient.setQueryData(conversationQueryKey(account, topic), conversation);
};

export function updateConversationQueryData(
  args: IArgs & { conversationUpdate: Partial<ConversationQueryData> }
) {
  const { conversationUpdate } = args;
  logger.debug(
    `[updateConversationQueryData] Updating conversation for ${args.topic} with account ${args.account}`
  );
  queryClient.setQueryData(
    getConversationQueryOptions(args).queryKey,
    (previousConversation) => {
      if (!previousConversation) {
        return undefined;
      }

      // Create new object while preserving prototype chain and methods
      return updateObjectAndMethods(previousConversation, conversationUpdate);
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
