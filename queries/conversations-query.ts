import { setConversationQueryData } from "@/queries/useConversationQuery";
import { mutateObjectProperties } from "@/utils/mutate-object-properties";
import {
  ConversationWithCodecsType,
  ConverseXmtpClientType,
} from "@/utils/xmtpRN/client.types";
import { conversationsQueryKey } from "@queries/QueryKeys";
import { QueryObserver, useQuery } from "@tanstack/react-query";
import logger from "@utils/logger";
import { getXmtpClient } from "@utils/xmtpRN/sync";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { queryClient } from "./queryClient";

export type IConversationsQuery = Awaited<ReturnType<typeof getConversations>>;

type IArgs = {
  account: string;
  context?: string;
};

export const createConversationsQueryObserver = (args: IArgs) => {
  logger.debug(
    `[ConversationsQuery] createConversationsQueryObserver for account ${args.account}`
  );
  return new QueryObserver(queryClient, getConversationsQueryOptions(args));
};

export const useConversationsQuery = (args: {
  account: string;
  context?: string;
}) => {
  const { account, context } = args;
  return useQuery<IConversationsQuery>(
    getConversationsQueryOptions({
      account,
      context: context ?? "",
    })
  );
};

export const prefetchConversationsQuery = (args: IArgs) => {
  return queryClient.prefetchQuery(getConversationsQueryOptions(args));
};

export const addConversationToConversationsQuery = (args: {
  account: string;
  conversation: ConversationWithCodecsType;
}) => {
  const { account, conversation } = args;
  logger.debug(
    `[ConversationsQuery] addConversationToConversationsQuery for account ${account}`
  );
  const previousConversationsData = getConversationsQueryData({
    account,
  });

  if (!previousConversationsData) {
    queryClient.setQueryData<IConversationsQuery>(
      getConversationsQueryOptions({
        account,
        context: "setConversationsQueryData",
      }).queryKey,
      [conversation]
    );
    return;
  }

  const conversationExists = previousConversationsData.some(
    (c) => c.topic === conversation.topic
  );

  if (conversationExists) {
    return;
  }

  queryClient.setQueryData<IConversationsQuery>(
    getConversationsQueryOptions({
      account,
      context: "setConversationsQueryData",
    }).queryKey,
    [conversation, ...previousConversationsData]
  );
};

export const getConversationsQueryData = (args: { account: string }) => {
  const { account } = args;
  logger.debug(
    `[ConversationsQuery] getConversationsQueryData for account ${account}`
  );
  return queryClient.getQueryData<IConversationsQuery>(
    getConversationsQueryOptions({
      account,
      context: "getConversationsQueryData",
    }).queryKey
  );
};

const getConversations = async (args: { account: string; context: string }) => {
  const { account, context } = args;

  logger.debug(
    `[ConversationsQuery] Fetching conversations from network ${context}`
  );

  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;

  const beforeSync = new Date().getTime();

  // Always include sync for now because we'll have react-query persist anyway to give us the local conversations
  await client.conversations.sync();
  await client.conversations.syncAllConversations("allowed");

  const afterSync = new Date().getTime();

  logger.debug(
    `[ConversationsQuery] Fetching conversations from network took ${
      (afterSync - beforeSync) / 1000
    } sec`
  );

  const conversations = await client.conversations.list({
    isActive: true,
    addedByInboxId: true,
    name: true,
    imageUrlSquare: true,
    consentState: true,
    lastMessage: true,
    description: true,
  });

  for (const conversation of conversations) {
    setConversationQueryData({
      account,
      topic: conversation.topic,
      conversation,
      context: "setConversationQueryData",
    });
  }

  return conversations;
};

export const getConversationsQueryOptions = (args: IArgs) => {
  const { account, context } = args;
  return {
    queryKey: conversationsQueryKey(account),
    queryFn: () => getConversations({ account, context: context ?? "" }),
    staleTime: 2000, // We want to make sure to always have the latest conversations
    enabled: !!account,
  };
};

export const updateConversationInConversationsQuery = (args: {
  account: string;
  topic: ConversationTopic;
  conversationUpdate: Partial<ConversationWithCodecsType>;
}) => {
  const { account, topic, conversationUpdate } = args;

  const previousConversationsData = getConversationsQueryData({
    account,
  });
  if (!previousConversationsData) {
    return;
  }
  const newConversations = previousConversationsData.map((c) => {
    if (c.topic === topic) {
      // Need to mutate otherwise some methods on the conversation object change to "undefined"...
      return mutateObjectProperties(c, conversationUpdate);
    }
    return c;
  });

  queryClient.setQueryData<IConversationsQuery>(
    getConversationsQueryOptions({
      account,
      context: "updateConversationInConversationsQuery",
    }).queryKey,
    newConversations
  );
};

export function fetchConversationsQuery(args: IArgs) {
  return queryClient.fetchQuery(getConversationsQueryOptions(args));
}
