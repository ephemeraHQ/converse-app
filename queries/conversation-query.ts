import { ensureConversationSyncAllQuery } from "@/queries/conversation-sync-all-query";
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

  const totalStart = new Date().getTime();

  /**
   * (START) TMP until we can fetch a single conversation and get ALL the properties for it (lastMessage, etc)
   */
  await Promise.all([
    ensureConversationSyncAllQuery({
      ethAddress: account,
      consentStates: ["allowed"],
    }),
    ensureConversationSyncAllQuery({
      ethAddress: account,
      consentStates: ["unknown"],
    }),
    ensureConversationSyncAllQuery({
      ethAddress: account,
      consentStates: ["denied"],
    }),
  ]);

  const client = await getXmtpClient({
    address: account,
  });

  const conversation = (
    await client.conversations.list({
      isActive: true,
      addedByInboxId: true,
      name: true,
      imageUrlSquare: true,
      consentState: true,
      lastMessage: true,
      description: true,
    })
  ).find((c) => c.topic === topic);

  if (!conversation) {
    throw new Error(`Conversation ${topic} not found`);
  }
  /**
   * (END) TMP until we can fetch a single conversation and get ALL the properties for it (lastMessage, etc)
   */

  // Try to find conversation in local DB first
  // let conversation = await client.conversations.findConversationByTopic(topic);

  // If not found locally, sync and try again
  // if (!conversation) {
  //   logger.warn(
  //     `[useConversationQuery] Conversation not found in local DB, syncing conversations`
  //   );

  //   await client.conversations.sync();
  //   conversation = await client.conversations.findConversationByTopic(topic);

  //   if (!conversation) {
  //     // Throwing here because if we have a topic, we should have a conversation
  //     throw new Error(`Conversation ${topic} not found`);
  //   }
  // }

  // await conversation.sync();

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
  queryClient.setQueryData(
    getConversationQueryOptions({
      account,
      topic,
    }).queryKey,
    conversation
  );
};

export function updateConversationQueryData(
  args: IGetConversationArgs & {
    conversationUpdate: Partial<ConversationQueryData>;
  }
) {
  const { conversationUpdate } = args;
  queryClient.setQueryData(
    getConversationQueryOptions(args).queryKey,
    (previousConversation) => {
      if (!previousConversation) {
        return undefined;
      }
      return updateObjectAndMethods(previousConversation, conversationUpdate);
    }
  );
}

export const getConversationQueryData = (args: IGetConversationArgs) => {
  return queryClient.getQueryData(getConversationQueryOptions(args).queryKey);
};

export function getOrFetchConversation(
  args: IGetConversationArgs & { caller: string }
) {
  return queryClient.ensureQueryData(getConversationQueryOptions(args));
}
