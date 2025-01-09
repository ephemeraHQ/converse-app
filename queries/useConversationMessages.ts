import { isReactionMessage } from "@/features/conversation/conversation-message/conversation-message.utils";
import { useAppStateHandlers } from "@/hooks/useAppStateHandlers";
import { contentTypesPrefixes } from "@/utils/xmtpRN/content-types/content-types";
import { UseQueryOptions, useQuery } from "@tanstack/react-query";
import logger from "@utils/logger";
import {
  ConversationWithCodecsType,
  DecodedMessageWithCodecsType,
} from "@/utils/xmtpRN/client.types";
import {
  InboxId,
  type ConversationTopic,
  type ReactionContent,
} from "@xmtp/react-native-sdk";
import {
  MessageId,
  MessagesOptions,
} from "@xmtp/react-native-sdk/build/lib/types";
import { conversationMessagesQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";
import { getConversationQueryData } from "./useConversationQuery";
import { getConversationByTopicForInboxId } from "@/utils/xmtpRN/conversations";

export type ConversationMessagesQueryData = Awaited<
  ReturnType<typeof conversationMessagesQueryFn>
>;

export const conversationMessagesQueryFn = async (
  conversation: ConversationWithCodecsType,
  options?: MessagesOptions
) => {
  const start = performance.now();
  logger.info("[useConversationMessages] queryFn fetching messages...");
  if (!conversation) {
    throw new Error("Conversation not found in conversationMessagesQueryFn");
  }
  const messages = await conversation.messages(options);
  const end = performance.now();
  logger.info(
    `[useConversationMessages] queryFn fetched ${messages.length} messages in ${end - start}ms`
  );
  const processingStart = performance.now();
  const processedMessages = processMessages({ messages });
  const processingEnd = performance.now();
  logger.info(
    `[useConversationMessages] queryFn processed ${messages.length} messages in ${processingEnd - processingStart}ms`
  );
  return processedMessages;
};

const conversationMessagesByTopicQueryFn = async (args: {
  inboxId: InboxId;
  topic: ConversationTopic;
  includeSync: boolean;
}) => {
  const { inboxId, topic, includeSync } = args;
  logger.info("[useConversationMessages] queryFn fetching messages by topic");
  const conversation = await getConversationByTopicForInboxId({
    inboxId,
    topic,
    includeSync,
  });
  if (!conversation) {
    throw new Error(
      "Conversation not found in conversationMessagesByTopicQueryFn"
    );
  }
  return conversationMessagesQueryFn(conversation);
};

export const useConversationMessages = (
  args: {
    inboxId: InboxId;
    topic: ConversationTopic;
  } & {
    includeSync: boolean;
  }
) => {
  const { inboxId, topic, includeSync } = args;
  const query = useQuery(
    getConversationMessagesQueryOptions({
      inboxId,
      topic,
      includeSync,
    })
  );

  useAppStateHandlers({
    onForeground: () => {
      query.refetch();
    },
  });

  return query;
};

export const getConversationMessagesQueryData = (
  args: {
    inboxId: InboxId;
    topic: ConversationTopic;
  } & {
    includeSync: boolean;
  }
) => {
  const { inboxId, topic, includeSync } = args;
  return queryClient.getQueryData<ConversationMessagesQueryData>(
    getConversationMessagesQueryOptions({
      inboxId,
      topic,
      includeSync,
    }).queryKey
  );
};

export function refetchConversationMessages(
  args: {
    inboxId: InboxId;
    topic: ConversationTopic;
  } & {
    includeSync: boolean;
  }
) {
  const { inboxId, topic, includeSync } = args;
  logger.info("[refetchConversationMessages] refetching messages");
  return queryClient.refetchQueries(
    getConversationMessagesQueryOptions({
      inboxId,
      topic,
      includeSync,
    })
  );
}

export const addConversationMessage = (args: {
  inboxId: InboxId;
  topic: ConversationTopic;
  message: DecodedMessageWithCodecsType;
}) => {
  const { inboxId, topic, message } = args;

  queryClient.setQueryData<ConversationMessagesQueryData>(
    conversationMessagesQueryKey({ inboxId, topic }),
    (previousMessages) => {
      const processedMessages = processMessages({
        messages: [message],
        existingData: previousMessages,
        prependNewMessages: true,
      });
      return processedMessages;
    }
  );
};

export const prefetchConversationMessagesForInboxByTopic = async (args: {
  inboxId: InboxId;
  topic: ConversationTopic;
}) => {
  const { inboxId, topic } = args;
  return queryClient.prefetchQuery(
    getConversationMessagesQueryOptions({
      inboxId,
      topic,
      includeSync:
        /* if we are prefetching messages, we want the freshest messages */ true,
    })
  );
};

function getConversationMessagesQueryOptions(args: {
  inboxId: InboxId;
  topic: ConversationTopic;
  includeSync: boolean;
}): UseQueryOptions<ConversationMessagesQueryData> {
  const { inboxId, topic, includeSync } = args;
  const conversation = getConversationQueryData({ inboxId, topic });
  return {
    queryKey: conversationMessagesQueryKey({ inboxId, topic }),
    queryFn: () => {
      return conversationMessagesByTopicQueryFn({
        inboxId,
        topic,
        includeSync,
      });
    },
    enabled: !!conversation,
    refetchOnMount: true, // Just for now because messages are very important and we want to make sure we have all of them
  };
}

const ignoredContentTypesPrefixes = [
  contentTypesPrefixes.coinbasePayment,
  contentTypesPrefixes.transactionReference,
  contentTypesPrefixes.readReceipt,
];

type IMessageAccumulator = {
  ids: MessageId[];
  byId: Record<MessageId, DecodedMessageWithCodecsType>;
  reactions: Record<
    MessageId,
    {
      bySender: Record<InboxId, ReactionContent[]>;
      byReactionContent: Record<string, InboxId[]>;
    }
  >;
};

function processMessages(args: {
  messages: DecodedMessageWithCodecsType[];
  existingData?: IMessageAccumulator;
  prependNewMessages?: boolean;
}): IMessageAccumulator {
  const { messages, existingData, prependNewMessages = false } = args;

  const result: IMessageAccumulator = existingData
    ? { ...existingData }
    : {
        ids: [],
        byId: {},
        reactions: {},
      };

  // For now, we ignore messages with these content types
  const validMessages = messages.filter(
    (message) =>
      !ignoredContentTypesPrefixes.some((prefix) =>
        message.contentTypeId.startsWith(prefix)
      )
  );

  // First process regular messages
  for (const message of validMessages) {
    // We handle reactions after
    if (!isReactionMessage(message)) {
      const messageId = message.id as MessageId;

      result.byId[messageId] = message;
      if (prependNewMessages) {
        result.ids = [messageId, ...result.ids];
      } else {
        result.ids.push(messageId);
      }
    }
  }

  const reactionsMessages = validMessages.filter(isReactionMessage);

  // Track which reactions we've already processed
  const processedReactions = new Set<string>();

  for (const reactionMessage of reactionsMessages) {
    const reactionContent = reactionMessage.content() as ReactionContent;
    const referenceMessageId = reactionContent?.reference as MessageId;
    const senderAddress = reactionMessage.senderInboxId as InboxId;

    if (!reactionContent || !referenceMessageId) {
      continue;
    }

    const reactionKey = `${reactionContent.content}-${referenceMessageId}`;

    // Skip if we've already processed a reaction from this sender for this content
    if (processedReactions.has(reactionKey)) {
      continue;
    }

    // Mark this reaction as processed
    processedReactions.add(reactionKey);

    if (!result.reactions[referenceMessageId]) {
      result.reactions[referenceMessageId] = {
        bySender: {},
        byReactionContent: {},
      };
    }

    const messageReactions = result.reactions[referenceMessageId];

    if (reactionContent.action === "added") {
      // Check if this sender already has this reaction for this message
      const hasExistingReaction = messageReactions.bySender[
        senderAddress
      ]?.some((reaction) => reaction.content === reactionContent.content);

      if (!hasExistingReaction) {
        messageReactions.byReactionContent[reactionContent.content] = [
          ...(messageReactions.byReactionContent[reactionContent.content] ||
            []),
          senderAddress,
        ];
        messageReactions.bySender[senderAddress] = [
          ...(messageReactions.bySender[senderAddress] || []),
          reactionContent,
        ];
      }
    } else if (reactionContent.action === "removed") {
      messageReactions.byReactionContent[reactionContent.content] = (
        messageReactions.byReactionContent[reactionContent.content] || []
      ).filter((id) => id !== senderAddress);
      messageReactions.bySender[senderAddress] = (
        messageReactions.bySender[senderAddress] || []
      ).filter((reaction) => reaction.content !== reactionContent.content);
    }
  }

  return result;
}

// WIP
type IOptimisticMessage = {
  tempId: string;
  messageId?: MessageId;
};

export function replaceOptimisticMessageWithReal(args: {
  tempId: string;
  topic: ConversationTopic;
  inboxId: InboxId;
  message: DecodedMessageWithCodecsType;
}) {
  const { tempId, topic, inboxId, message } = args;
  logger.info(
    "[linkOptimisticMessageToReal] linking optimistic message to real",
    {
      tempId,
      messageId: message.id,
    }
  );

  queryClient.setQueryData<ConversationMessagesQueryData>(
    conversationMessagesQueryKey({ inboxId, topic }),
    (previousMessages) => {
      if (!previousMessages) {
        return {
          ids: [message.id as MessageId],
          byId: {
            [message.id as MessageId]: message,
          },
          reactions: {},
        };
      }

      // Find the index of the temporary message
      const tempIndex = previousMessages.ids.indexOf(tempId as MessageId);

      if (tempIndex === -1) {
        return previousMessages;
      }

      // Create new ids array with the real message id replacing the temp id
      const newIds = [...previousMessages.ids];
      newIds[tempIndex] = message.id as MessageId;

      // Create new byId object without the temp message and with the real message
      const newById = { ...previousMessages.byId };
      delete newById[tempId as MessageId];
      newById[message.id as MessageId] = message;

      return {
        ...previousMessages,
        ids: newIds,
        byId: newById,
      };
    }
  );
}
