import { captureError } from "@/utils/capture-error";
import logger from "@/utils/logger";
import { updateObjectAndMethods } from "@/utils/update-object-and-methods";
import { getXmtpClient } from "@/utils/xmtpRN/xmtp-client/xmtp-client";
import { queryOptions, useQuery } from "@tanstack/react-query";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { conversationQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";

export type ConversationQueryData = Awaited<ReturnType<typeof getConversation>>;

type IGetConversationArgs = {
  account: string;
  topic: ConversationTopic;
};

async function getConversation(args: IGetConversationArgs) {
  const { account, topic } = args;

  if (!topic) {
    throw new Error("Topic is required");
  }

  if (!account) {
    throw new Error("Account is required");
  }

  const client = await getXmtpClient({
    address: account,
  });

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
    await conversation.sync();
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

export const useConversationQuery = (
  args: IGetConversationArgs & { caller: string }
) => {
  return useQuery(getConversationQueryOptions(args));
};

export function getConversationQueryOptions(
  args: IGetConversationArgs & {
    // Optional because some react query function will never trigger the queryFn anyway
    caller?: string;
  }
) {
  const { account, topic, caller } = args;
  return queryOptions({
    meta: {
      caller,
    },
    queryKey: conversationQueryKey(account, topic),
    queryFn: () => getConversation({ account, topic }),
    enabled: !!topic && !!account,
  });
}

export const setConversationQueryData = (
  args: IGetConversationArgs & {
    conversation: ConversationQueryData;
  }
) => {
  const { account, topic, conversation } = args;
  queryClient.setQueryData(conversationQueryKey(account, topic), conversation);
};

export function updateConversationQueryData(
  args: IGetConversationArgs & {
    conversationUpdate: Partial<ConversationQueryData>;
  }
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

export function refetchConversationQuery(
  args: IGetConversationArgs & { caller: string }
) {
  return queryClient.refetchQueries(getConversationQueryOptions(args));
}

export const getConversationQueryData = (args: IGetConversationArgs) => {
  return queryClient.getQueryData(getConversationQueryOptions(args).queryKey);
};

export function getOrFetchConversation(
  args: IGetConversationArgs & { caller: string }
) {
  return queryClient.ensureQueryData(getConversationQueryOptions(args));
}
