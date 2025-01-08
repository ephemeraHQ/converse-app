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
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { queryClient } from "./queryClient";
import { xmtpClientByInboxId } from "@/utils/xmtpRN/client";

export type ConversationListQueryData = Awaited<
  ReturnType<typeof getConversationList>
>;

export const createConversationListQueryObserver = (args: {
  inboxId: string;
  context: string;
  includeSync?: boolean;
}) => {
  return new QueryObserver(queryClient, conversationListQueryConfig(args));
};

export const useConversationListQuery = (args: {
  inboxId: string | undefined;
  queryOptions?: Partial<UseQueryOptions<ConversationListQueryData>>;
  context?: string;
}) => {
  const { inboxId, queryOptions, context } = args;
  return useQuery<ConversationListQueryData>({
    ...conversationListQueryConfig({ inboxId, context: context ?? "" }),
    ...queryOptions,
  });
};

export const fetchPersistedConversationListQuery = (args: {
  inboxId: string;
}) => {
  const { inboxId } = args;
  return queryClient.fetchQuery(
    conversationListQueryConfig({
      inboxId,
      context: "fetchPersistedConversationListQuery",
      includeSync: false,
    })
  );
};

export const fetchConversationListQuery = (args: { inboxId: string }) => {
  const { inboxId } = args;
  return queryClient.fetchQuery(
    conversationListQueryConfig({
      inboxId,
      context: "fetchConversationListQuery",
    })
  );
};

export const prefetchConversationListQuery = (args: { inboxId: string }) => {
  const { inboxId } = args;
  return queryClient.prefetchQuery(
    conversationListQueryConfig({
      inboxId,
      context: "prefetchConversationListQuery",
    })
  );
};

export function refetchConversationListQuery(args: { inboxId: string }) {
  const { inboxId } = args;
  return queryClient.refetchQueries({
    queryKey: conversationListQueryConfig({
      inboxId,
      context: "refetchConversationListQuery",
    }).queryKey,
  });
}

export const addConversationToConversationListQuery = (args: {
  inboxId: string | undefined;
  conversation: ConversationWithCodecsType;
}) => {
  const { inboxId, conversation } = args;
  if (!inboxId) {
    logger.error(
      "[addConversationToConversationListQuery] Inbox ID is required; noop"
    );
    return;
  }
  const previousConversationsData = getConversationListQueryData({ inboxId });
  if (!previousConversationsData) {
    setConversationListQueryData({ inboxId, conversations: [conversation] });
    return;
  }

  const conversationExists = previousConversationsData.some(
    (c) => c.topic === conversation.topic
  );

  if (conversationExists) {
    return;
  }

  setConversationListQueryData({
    inboxId,
    conversations: [conversation, ...previousConversationsData],
  });
};

export const updateConversationInConversationListQuery = (args: {
  inboxId: string | undefined;
  topic: ConversationTopic;
  conversationUpdate: Partial<ConversationWithCodecsType>;
}) => {
  const { inboxId, topic, conversationUpdate } = args;
  const previousConversationsData = getConversationListQueryData({ inboxId });
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
  setConversationListQueryData({ inboxId, conversations: newConversations });
};

export const getConversationListQueryData = (args: {
  inboxId: string | undefined;
}) => {
  const { inboxId } = args;
  return queryClient.getQueryData<ConversationListQueryData>(
    conversationListQueryConfig({
      inboxId,
      context: "getConversationListQueryData",
    }).queryKey
  );
};

export const setConversationListQueryData = (args: {
  inboxId: string | undefined;
  conversations: ConversationListQueryData;
}) => {
  const { inboxId, conversations } = args;
  if (!inboxId) {
    return;
  }
  return queryClient.setQueryData<ConversationListQueryData>(
    conversationListQueryConfig({
      inboxId,
      context: "setConversationListQueryData",
    }).queryKey,
    conversations
  );
};

const getConversationList = async (args: {
  inboxId: string | undefined;
  context: string;
  includeSync?: boolean;
}) => {
  const { inboxId, context, includeSync = true } = args;
  try {
    logger.debug(
      `[ConversationListQuery] Fetching conversation list from network ${context}`
    );

    if (!inboxId) {
      logger.warn(
        `[ConversationListQuery] No inboxId provided for conversation list query`
      );
      return;
    }

    const client: ConverseXmtpClientType = xmtpClientByInboxId[inboxId];
    if (!client) {
      logger.warn(
        `[ConversationListQuery] No client found for inboxId ${inboxId}`
      );
      return;
    }

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
        inboxId,
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
  inboxId: string | undefined;
  context: string;
  includeSync?: boolean;
}) => {
  const { inboxId, context, includeSync = true } = args;
  return {
    queryKey: [
      QueryKeys.CONVERSATIONS,
      inboxId?.toLowerCase(), // All queries are case sensitive, sometimes we use checksum, but the SDK use lowercase, always use lowercase
    ],
    queryFn: () => getConversationList({ inboxId, context, includeSync }),
    staleTime: 2000,
    enabled: !!inboxId,
  };
};
