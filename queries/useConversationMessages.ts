import { useQuery, UseQueryOptions } from "@tanstack/react-query";

import logger from "@utils/logger";
import {
  ConversationWithCodecsType,
  DecodedMessageWithCodecsType,
} from "@utils/xmtpRN/client";
import { getConversationByTopicByAccount } from "@utils/xmtpRN/conversations";
import type {
  ConversationTopic,
  ReactionContent,
} from "@xmtp/react-native-sdk";
import { cacheOnlyQueryOptions } from "./cacheOnlyQueryOptions";
import { queryClient } from "./queryClient";
import { conversationMessagesQueryKey } from "./QueryKeys";
import { useConversationQuery } from "./useConversationQuery";
import { useRefreshOnFocus } from "./useRefreshOnFocus";
import { MessagesOptions } from "@xmtp/react-native-sdk/build/lib/types";

export type ConversationMessagesQueryData = {
  ids: string[];
  byId: Record<string, DecodedMessageWithCodecsType>;
  reactions: Record<
    string,
    {
      bySender: Record<string, string[]>;
      byReactionContent: Record<string, string[]>;
    }
  >;
};

export const conversationMessagesQueryFn = async (
  conversation: ConversationWithCodecsType,
  options?: MessagesOptions
): Promise<ConversationMessagesQueryData> => {
  logger.info("[useConversationMessages] queryFn fetching messages");
  if (!conversation) {
    return {
      ids: [],
      byId: {},
      reactions: {},
    };
  }
  const messages = await conversation.messages(options);
  const ids: string[] = [];
  const byId: Record<string, DecodedMessageWithCodecsType> = {};
  const reactions: Record<
    string,
    {
      bySender: Record<string, string[]>;
      byReactionContent: Record<string, string[]>;
    }
  > = {};

  for (const message of messages) {
    ids.push(message.id);
    byId[message.id] = message;
    if (message.contentTypeId.includes("reaction:")) {
      const reactionContent = message.content() as ReactionContent;
      if (!reactionContent) {
        continue;
      }
      const referenceMessageId = reactionContent.reference;
      if (!referenceMessageId) {
        continue;
      }
      if (!reactions[referenceMessageId]) {
        reactions[referenceMessageId] = {
          bySender: {},
          byReactionContent: {},
        };
      }
      reactions[referenceMessageId].byReactionContent[reactionContent.content] =
        [
          ...(reactions[referenceMessageId].byReactionContent[
            reactionContent.content
          ] || []),
          message.senderAddress,
        ];
      reactions[referenceMessageId].bySender[message.senderAddress] = [
        ...(reactions[referenceMessageId].bySender[message.senderAddress] ||
          []),
        reactionContent.content,
      ];
    }
  }

  return {
    ids,
    byId,
    reactions,
  };
};

const conversationMessagesByTopicQueryFn = async (
  account: string,
  topic: ConversationTopic
) => {
  logger.info("[useConversationMessages] queryFn fetching messages by topic");
  const conversation = await getConversationByTopicByAccount({
    account,
    topic,
  });
  return conversationMessagesQueryFn(conversation!);
};

export const useConversationMessages = (
  account: string,
  topic: ConversationTopic,
  options?: Partial<UseQueryOptions<ConversationMessagesQueryData>>
) => {
  const { data: conversation } = useConversationQuery(
    account,
    topic,
    cacheOnlyQueryOptions
  );

  const queryData = useQuery({
    queryKey: conversationMessagesQueryKey(account, topic),
    queryFn: async () => {
      return conversationMessagesQueryFn(conversation!);
    },
    enabled: !!conversation,
    ...options,
  });
  useRefreshOnFocus(async (): Promise<void> => {
    if (options?.refetchOnWindowFocus) {
      await queryData.refetch();
    }
  });

  return queryData;
};

export const getConversationMessages = (
  account: string,
  topic: ConversationTopic
) => {
  return queryClient.getQueryData<ConversationMessagesQueryData>(
    conversationMessagesQueryKey(account, topic)
  );
};

const setConversationMessages = (
  account: string,
  topic: ConversationTopic,
  messages: ConversationMessagesQueryData
) => {
  queryClient.setQueryData(
    conversationMessagesQueryKey(account, topic),
    messages
  );
};

export const addConversationMessage = (
  account: string,
  topic: ConversationTopic,
  message: DecodedMessageWithCodecsType
) => {
  const previousMessages = getConversationMessages(account, topic);
  if (!previousMessages) {
    setConversationMessages(account, topic, {
      ids: [message.id],
      byId: { [message.id]: message },
      reactions: {},
    });
    return;
  }
  previousMessages.byId[message.id] = message;
  setConversationMessages(account, topic, {
    ids: [message.id, ...previousMessages.ids],
    byId: previousMessages.byId,
    reactions: previousMessages.reactions,
  });
};

export const prefetchConversationMessages = async (
  account: string,
  topic: ConversationTopic
) => {
  return queryClient.prefetchQuery({
    queryKey: conversationMessagesQueryKey(account.toLowerCase(), topic),
    queryFn: () => {
      logger.info("[prefetchConversationMessages] prefetching messages");
      return conversationMessagesByTopicQueryFn(account, topic);
    },
  });
};
