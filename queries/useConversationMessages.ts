import { isReactionMessage } from "@/features/conversation/conversation-message/conversation-message.utils";
import { contentTypesPrefixes } from "@/utils/xmtpRN/content-types/content-types";
import { useQuery } from "@tanstack/react-query";
import logger from "@utils/logger";
import {
  ConversationWithCodecsType,
  DecodedMessageWithCodecsType,
} from "@utils/xmtpRN/client";
import { getConversationByTopicByAccount } from "@utils/xmtpRN/conversations";
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

export type ConversationMessagesQueryData = Awaited<
  ReturnType<typeof conversationMessagesQueryFn>
>;

export const conversationMessagesQueryFn = async (
  conversation: ConversationWithCodecsType,
  options?: MessagesOptions
) => {
  logger.info("[useConversationMessages] queryFn fetching messages");

  if (!conversation) {
    throw new Error("Conversation not found in conversationMessagesQueryFn");
  }

  const messages = await conversation.messages(options);
  return processMessages({ messages });
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
  if (!conversation) {
    throw new Error(
      "Conversation not found in conversationMessagesByTopicQueryFn"
    );
  }
  return conversationMessagesQueryFn(conversation);
};

export const useConversationMessages = (
  account: string,
  topic: ConversationTopic
) => {
  return useQuery(getConversationMessagesQueryOptions(account, topic));
};

export const getConversationMessages = (
  account: string,
  topic: ConversationTopic
) => {
  return queryClient.getQueryData<ConversationMessagesQueryData>(
    getConversationMessagesQueryOptions(account, topic).queryKey
  );
};

export function refetchConversationMessages(
  account: string,
  topic: ConversationTopic
) {
  logger.info("[refetchConversationMessages] refetching messages");
  return queryClient.refetchQueries(
    getConversationMessagesQueryOptions(account, topic)
  );
}

export const addConversationMessage = (args: {
  account: string;
  topic: ConversationTopic;
  message: DecodedMessageWithCodecsType;
}) => {
  const { account, topic, message } = args;

  queryClient.setQueryData<ConversationMessagesQueryData>(
    conversationMessagesQueryKey(account, topic),
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

export const prefetchConversationMessages = async (
  account: string,
  topic: ConversationTopic
) => {
  return queryClient.prefetchQuery(
    getConversationMessagesQueryOptions(account, topic)
  );
};

function getConversationMessagesQueryOptions(
  account: string,
  topic: ConversationTopic
) {
  const conversation = getConversationQueryData(account, topic);
  return {
    queryKey: conversationMessagesQueryKey(account, topic),
    queryFn: () => {
      return conversationMessagesByTopicQueryFn(account, topic);
    },
    enabled: !!conversation,
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
    const senderAddress = reactionMessage.senderAddress as InboxId;

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
  account: string;
  message: DecodedMessageWithCodecsType;
}) {
  const { tempId, topic, account, message } = args;
  logger.info(
    "[linkOptimisticMessageToReal] linking optimistic message to real",
    {
      tempId,
      messageId: message.id,
    }
  );

  queryClient.setQueryData<ConversationMessagesQueryData>(
    conversationMessagesQueryKey(account, topic),
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
