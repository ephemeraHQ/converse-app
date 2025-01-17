import { setConversationQueryData } from "@/queries/useConversationQuery";
import { updateObjectAndMethods } from "@/utils/update-object-and-methods";
import {
  ConversationWithCodecsType,
  ConverseXmtpClientType,
} from "@/utils/xmtpRN/client.types";
import { conversationsQueryKey } from "@queries/QueryKeys";
import { QueryObserver, queryOptions, useQuery } from "@tanstack/react-query";
import logger from "@utils/logger";
import { getXmtpClient } from "@utils/xmtpRN/sync";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { queryClient } from "./queryClient";

export type IConversationsQuery = Awaited<ReturnType<typeof getConversations>>;

type IArgs = {
  account: string;
};

export const createConversationsQueryObserver = (args: IArgs) => {
  logger.debug(
    `[ConversationsQuery] createConversationsQueryObserver for account ${args.account}`
  );
  return new QueryObserver(queryClient, getConversationsQueryOptions(args));
};

export const useConversationsQuery = (args: { account: string }) => {
  const { account } = args;
  return useQuery<IConversationsQuery>(
    getConversationsQueryOptions({
      account,
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
      getConversationsQueryOptions({ account }).queryKey,
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
    getConversationsQueryOptions({ account }).queryKey,
    [conversation, ...previousConversationsData]
  );
};

export const getConversationsQueryData = (args: { account: string }) => {
  const { account } = args;
  return queryClient.getQueryData<IConversationsQuery>(
    getConversationsQueryOptions({
      account,
    }).queryKey
  );
};

const getConversations = async (args: { account: string }) => {
  const { account } = args;

  logger.debug("[ConversationsQuery] Fetching conversations from network");

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

  // For now conversations have all the same properties as one conversation
  for (const conversation of conversations) {
    setConversationQueryData({
      account,
      topic: conversation.topic,
      conversation,
    });
  }

  return conversations;
};

export const getConversationsQueryOptions = (args: IArgs) => {
  const { account } = args;
  return queryOptions({
    // note(lustig) we follow a slightly strange pattern of passing the
    // "context" through to the query for logging purposes.
    // we can obviously ignore this from our query key

    queryKey: conversationsQueryKey(account),
    queryFn: () => getConversations({ account }),
    enabled: !!account,
    refetchOnMount: true, // Just for now because conversations are very important and we want to make sure we have all of them
  });
};

export const updateConversationInConversationsQueryData = (args: {
  account: string;
  topic: ConversationTopic;
  conversationUpdate: Partial<ConversationWithCodecsType>;
}) => {
  const { account, topic, conversationUpdate } = args;

  logger.debug(
    `[ConversationsQuery] updateConversationInConversationsQueryData for account ${account} and topic ${topic}`
  );

  const previousConversationsData = getConversationsQueryData({
    account,
  });
  if (!previousConversationsData) {
    return;
  }
  const newConversations = previousConversationsData.map((c) => {
    if (c.topic === topic) {
      return updateObjectAndMethods(c, conversationUpdate);
    }
    return c;
  });

  queryClient.setQueryData<IConversationsQuery>(
    getConversationsQueryOptions({
      account,
    }).queryKey,
    newConversations
  );
};

export function fetchConversationsQuery(args: IArgs) {
  return queryClient.fetchQuery(getConversationsQueryOptions(args));
}
