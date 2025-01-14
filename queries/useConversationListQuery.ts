import { setConversationQueryData } from "@/queries/useConversationQuery";
import { mutateObjectProperties } from "@/utils/mutate-object-properties";
import {
  ConversationWithCodecsType,
  ConverseXmtpClientType,
} from "@/utils/xmtpRN/client.types";
import { QueryKeys } from "@queries/QueryKeys";
import { QueryObserver, useQuery } from "@tanstack/react-query";
import logger from "@utils/logger";
import { getXmtpClient } from "@utils/xmtpRN/sync";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { queryClient } from "./queryClient";

export type ConversationListQueryData = Awaited<
  ReturnType<typeof getConversationList>
>;

export const createConversationListQueryObserver = (args: {
  account: string;
  context: string;
  includeSync?: boolean;
}) => {
  logger.debug(
    `[ConversationListQuery] createConversationListQueryObserver for account ${args.account}`
  );
  return new QueryObserver(queryClient, getConversationListQueryConfig(args));
};

export const useConversationListQuery = (args: {
  account: string;
  context?: string;
}) => {
  const { account, context } = args;
  return useQuery<ConversationListQueryData>(
    getConversationListQueryConfig({ account, context: context ?? "" })
  );
};

export const fetchPersistedConversationListQuery = (args: {
  account: string;
}) => {
  const { account } = args;
  logger.debug(
    `[ConversationListQuery] fetchPersistedConversationListQuery for account ${account}`
  );
  return queryClient.fetchQuery(
    getConversationListQueryConfig({
      account,
      context: "fetchPersistedConversationListQuery",
      includeSync: false,
    })
  );
};

export const fetchConversationListQuery = (args: { account: string }) => {
  const { account } = args;
  logger.debug(
    `[ConversationListQuery] fetchConversationListQuery for account ${account}`
  );
  return queryClient.fetchQuery(
    getConversationListQueryConfig({
      account,
      context: "fetchConversationListQuery",
    })
  );
};

export const prefetchConversationListQuery = (args: { account: string }) => {
  const { account } = args;
  return queryClient.prefetchQuery(
    getConversationListQueryConfig({
      account,
      context: "prefetchConversationListQuery",
    })
  );
};

export function refetchConversationListQuery(args: { account: string }) {
  const { account } = args;
  logger.debug(
    `[ConversationListQuery] refetchConversationListQuery for account ${account}`
  );
  return queryClient.refetchQueries({
    queryKey: getConversationListQueryConfig({
      account,
      context: "refetchConversationListQuery",
    }).queryKey,
  });
}

export const addConversationToConversationListQuery = (args: {
  account: string;
  conversation: ConversationWithCodecsType;
}) => {
  const { account, conversation } = args;
  logger.debug(
    `[ConversationListQuery] addConversationToConversationListQuery for account ${account}`
  );
  const previousConversationsData = getConversationListQueryData({ account });
  if (!previousConversationsData) {
    setConversationListQueryData({ account, conversations: [conversation] });
    return;
  }

  const conversationExists = previousConversationsData.some(
    (c) => c.topic === conversation.topic
  );

  if (conversationExists) {
    return;
  }

  setConversationListQueryData({
    account,
    conversations: [conversation, ...previousConversationsData],
  });
};

export const updateConversationInConversationListQuery = (args: {
  account: string;
  topic: ConversationTopic;
  conversationUpdate: Partial<ConversationWithCodecsType>;
}) => {
  const { account, topic, conversationUpdate } = args;
  logger.debug(
    `[ConversationListQuery] updateConversationInConversationListQuery for account ${account} and topic ${topic}`
  );
  const previousConversationsData = getConversationListQueryData({ account });
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
  setConversationListQueryData({ account, conversations: newConversations });
};

export const getConversationListQueryData = (args: { account: string }) => {
  const { account } = args;
  logger.debug(
    `[ConversationListQuery] getConversationListQueryData for account ${account}`
  );
  return queryClient.getQueryData<ConversationListQueryData>(
    getConversationListQueryConfig({
      account,
      context: "getConversationListQueryData",
    }).queryKey
  );
};

export const setConversationListQueryData = (args: {
  account: string;
  conversations: ConversationListQueryData;
}) => {
  const { account, conversations } = args;
  return queryClient.setQueryData<ConversationListQueryData>(
    getConversationListQueryConfig({
      account,
      context: "setConversationListQueryData",
    }).queryKey,
    conversations
  );
};

const getConversationList = async (args: {
  account: string;
  context: string;
  includeSync?: boolean;
}) => {
  const { account, context, includeSync = true } = args;
  try {
    logger.debug(
      `[ConversationListQuery] Fetching conversation list from network ${context}`
    );

    const client = (await getXmtpClient(account)) as ConverseXmtpClientType;

    const beforeSync = new Date().getTime();

    if (includeSync) {
      await client.conversations.sync();
      await client.conversations.syncAllConversations();
    }

    const afterSync = new Date().getTime();

    logger.debug(
      `[ConversationListQuery] Fetching conversation list from network took ${
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
  } catch (error) {
    logger.error(
      `[ConversationListQuery] Error fetching conversation list from network ${context}`,
      error
    );
    throw error;
  }
};

export const getConversationListQueryConfig = (args: {
  account: string;
  context: string;
  includeSync?: boolean;
}) => {
  const { account, context, includeSync = true } = args;
  return {
    queryKey: [
      QueryKeys.CONVERSATIONS,
      account?.toLowerCase(), // All queries are case sensitive, sometimes we use checksum, but the SDK use lowercase, always use lowercase
    ],
    queryFn: () => getConversationList({ account, context, includeSync }),
    staleTime: 2000,
    enabled: !!account,
  };
};
