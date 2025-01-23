import { setConversationQueryData } from "@/queries/useConversationQuery";
import { captureError } from "@/utils/capture-error";
import { reactQueryPersister } from "@/utils/mmkv";
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

export const useConversationsQuery = (args: IArgs & { caller: string }) => {
  return useQuery<IConversationsQuery>(getConversationsQueryOptions(args));
};

export const prefetchConversationsQuery = (args: IArgs) => {
  return queryClient.prefetchQuery(getConversationsQueryOptions(args));
};

export const addConversationToConversationsQuery = (
  args: IArgs & {
    conversation: ConversationWithCodecsType;
  }
) => {
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

export const getConversationsQueryData = (args: IArgs) => {
  return queryClient.getQueryData<IConversationsQuery>(
    getConversationsQueryOptions(args).queryKey
  );
};

const getConversations = async (
  args: IArgs & {
    // We want to track who's making new calls to the network
    caller: string;
  }
) => {
  const { account, caller } = args;

  if (!caller) {
    logger.warn(
      `[ConversationsQuery] getConversations called without caller for account ${account}`
    );
  }

  logger.debug(
    `[ConversationsQuery] Fetching conversations from network for account ${account} with caller "${caller}"`
  );

  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;

  const beforeSync = new Date().getTime();
  await client.conversations.syncAllConversations(["allowed"]);
  const afterSync = new Date().getTime();

  const timeDiff = afterSync - beforeSync;
  if (timeDiff > 3000) {
    captureError(
      new Error(
        `[ConversationsQuery] Fetching conversations from network took ${timeDiff}ms for account ${account} caller ${caller}`
      )
    );
  }

  const conversations = await client.conversations.list(
    {
      isActive: true,
      addedByInboxId: true,
      name: true,
      imageUrlSquare: true,
      consentState: true,
      lastMessage: true,
      description: true,
    },
    20 // For now we only fetch 20 until we have the right pagination system. At least people will be able to see their conversations
  );

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

export const getConversationsQueryOptions = (
  args: IArgs & {
    // We make it optional here because lots of places we use react-query stuff like "getQueryData" will never call the queryFn.
    // So we don't want to force them to add a caller argument
    caller?: string;
  }
) => {
  const { account, caller } = args;
  return queryOptions({
    // since we don't want to add caller to the deps
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: conversationsQueryKey(account),
    queryFn: () =>
      getConversations({
        account,
        caller: caller!, // Let's assume that all places where we need a caller will have it otherwise we have warning logs anyway
      }),
    enabled: !!account,
    // Just for now because conversations are very important and
    // we want to make sure we have all of them
    refetchOnMount: true,
    persister: reactQueryPersister,
  });
};

export const updateConversationInConversationsQueryData = (
  args: IArgs & {
    topic: ConversationTopic;
    conversationUpdate: Partial<ConversationWithCodecsType>;
  }
) => {
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

export function fetchConversationsQuery(args: IArgs & { caller: string }) {
  return queryClient.fetchQuery(getConversationsQueryOptions(args));
}
