import { captureError } from "@/utils/capture-error";
import logger from "@/utils/logger";
import { updateObjectAndMethods } from "@/utils/update-object-and-methods";
import { ConverseXmtpClientType } from "@/utils/xmtpRN/client.types";
import { getXmtpClient } from "@/utils/xmtpRN/sync";
import { queryOptions, useQuery } from "@tanstack/react-query";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { conversationQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";

export type ConversationQueryData = Awaited<ReturnType<typeof getConversation>>;

type IArgs = {
  account: string;
  topic: ConversationTopic;
};

async function getConversation(args: IArgs) {
  logger.debug("[MEMBERS DEBUGGING 1111] getConversation  ", args);
  const { account, topic } = args;

  logger.debug(
    `[useConversationQuery] Getting conversation for ${topic} with account ${account}`
  );

  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;

  const totalStart = new Date().getTime();

  // Try to find conversation in local DB first
  let conversation = await client.conversations.findConversationByTopic(topic);

  // If not found locally, sync and try again
  if (!conversation) {
    logger.warn(
      `[useConversationQuery] Conversation not found in local DB, syncing conversations`
    );
    await client.conversations.sync();
    conversation = await client.conversations.findConversationByTopic(topic);
    if (!conversation) {
      throw new Error(`Conversation ${topic} not found`);
    }
  }

  const totalEnd = new Date().getTime();
  const totalTimeDiff = totalEnd - totalStart;

  if (totalTimeDiff > 3000) {
    captureError(
      new Error(
        `[useConversationQuery] Fetched conversation for ${topic} in ${totalTimeDiff}ms`
      )
    );
  }

  return conversation;
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
