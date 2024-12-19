import { setConversationQueryData } from "@/queries/useConversationQuery";
import { mutateObjectProperties } from "@/utils/mutate-object-properties";
import { QueryKeys } from "@queries/QueryKeys";
import {
  QueryObserver,
  UseQueryOptions,
  useQuery,
} from "@tanstack/react-query";
import logger from "@utils/logger";
import {
  ConversationWithCodecsType,
  ConverseXmtpClientType,
} from "@/utils/xmtpRN/client.types";
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
  return new QueryObserver(queryClient, conversationListQueryConfig(args));
};

export const useConversationListQuery = (args: {
  account: string;
  queryOptions?: Partial<UseQueryOptions<ConversationListQueryData>>;
  context?: string;
}) => {
  const { account, queryOptions, context } = args;
  return useQuery<ConversationListQueryData>({
    ...conversationListQueryConfig({ account, context: context ?? "" }),
    ...queryOptions,
  });
};

export const fetchPersistedConversationListQuery = (args: {
  account: string;
}) => {
  const { account } = args;
  return queryClient.fetchQuery(
    conversationListQueryConfig({
      account,
      context: "fetchPersistedConversationListQuery",
      includeSync: false,
    })
  );
};

export const fetchConversationListQuery = (args: { account: string }) => {
  const { account } = args;
  return queryClient.fetchQuery(
    conversationListQueryConfig({
      account,
      context: "fetchConversationListQuery",
    })
  );
};

export const prefetchConversationListQuery = (args: { account: string }) => {
  const { account } = args;
  return queryClient.prefetchQuery(
    conversationListQueryConfig({
      account,
      context: "prefetchConversationListQuery",
    })
  );
};

export function refetchConversationListQuery(args: { account: string }) {
  const { account } = args;
  return queryClient.refetchQueries({
    queryKey: conversationListQueryConfig({
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
  return queryClient.getQueryData<ConversationListQueryData>(
    conversationListQueryConfig({
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
    conversationListQueryConfig({
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
      "lastMessage" // Order by last message
    );

    for (const conversation of conversations) {
      setConversationQueryData({
        account,
        topic: conversation.topic,
        conversation,
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

export const conversationListQueryConfig = (args: {
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
