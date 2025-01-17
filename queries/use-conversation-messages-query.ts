import { isReactionMessage } from "@/features/conversation/conversation-message/conversation-message.utils";
import { captureError } from "@/utils/capture-error";
import { updateObjectAndMethods } from "@/utils/update-object-and-methods";
import { DecodedMessageWithCodecsType } from "@/utils/xmtpRN/client/client.types";
import { contentTypesPrefixes } from "@/utils/xmtpRN/content-types/content-types";
import { isSupportedMessage } from "@/utils/xmtpRN/xmtp-messages/xmtp-messages";
import { queryOptions, useQuery } from "@tanstack/react-query";
import logger from "@utils/logger";
import {
  InboxId,
  type ConversationTopic,
  type ReactionContent,
} from "@xmtp/react-native-sdk";
import { MessageId } from "@xmtp/react-native-sdk/build/lib/types";
import { conversationMessagesQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";
import {
  getConversationQueryData,
  getOrFetchConversation,
} from "./useConversationQuery";

export type ConversationMessagesQueryData = Awaited<
  ReturnType<typeof conversationMessagesQueryFn>
>;

const conversationMessagesQueryFn = async (args: {
  account: string;
  topic: ConversationTopic;
}) => {
  const { account, topic } = args;

  if (!account) {
    throw new Error("account is required");
  }

  if (!topic) {
    throw new Error("topic is required");
  }

  // If we are getting the messages it means we have the conversation in the query cache for sure or it's a bug
  const conversation = await getOrFetchConversation({
    account,
    topic,
    caller: "conversationMessagesQueryFn",
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const start = performance.now();

  await conversation.sync();

  const messages = await conversation.messages({
    limit: 30, // Fetch limited messages for better performance until pagination is implemented
  });

  const timeDiff = performance.now() - start;

  if (timeDiff > 3000) {
    captureError(
      new Error(
        `[useConversationMessages] Fetched ${messages.length} messages in ${timeDiff}ms for conversation ${topic}`
      )
    );
  }

  const validMessages = messages.filter(isSupportedMessage);

  return processMessages({ newMessages: validMessages });
};

export const useConversationMessagesQuery = (args: {
  account: string;
  topic: ConversationTopic;
  caller: string;
}) => {
  return useQuery(getConversationMessagesQueryOptions(args));
};

export const getConversationMessagesQueryData = (args: {
  account: string;
  topic: ConversationTopic;
}) => {
  return queryClient.getQueryData(
    getConversationMessagesQueryOptions(args).queryKey
  );
};

export function refetchConversationMessages(args: {
  account: string;
  topic: ConversationTopic;
  caller: string;
}) {
  logger.debug("[refetchConversationMessages] refetching messages");
  return queryClient.refetchQueries(getConversationMessagesQueryOptions(args));
}

export const addConversationMessageQuery = (args: {
  account: string;
  topic: ConversationTopic;
  message: DecodedMessageWithCodecsType;
}) => {
  const { account, topic, message } = args;

  queryClient.setQueryData(
    getConversationMessagesQueryOptions({ account, topic }).queryKey,
    (previousMessages) => {
      const processedMessages = processMessages({
        newMessages: [message],
        existingData: previousMessages,
        prependNewMessages: true,
      });
      return processedMessages;
    }
  );
};

export const prefetchConversationMessages = async (args: {
  account: string;
  topic: ConversationTopic;
  caller: string;
}) => {
  return queryClient.prefetchQuery(getConversationMessagesQueryOptions(args));
};

export function getConversationMessagesQueryOptions(args: {
  account: string;
  topic: ConversationTopic;
  caller?: string; // Optional because we don't want functions that just get or set query data to have to pass caller
}) {
  const { account, topic, caller } = args;
  const conversation = getConversationQueryData({
    account,
    topic,
  });
  return queryOptions({
    meta: {
      caller,
    },
    queryKey: conversationMessagesQueryKey(account, topic),
    queryFn: () => conversationMessagesQueryFn({ account, topic }),
    enabled: !!conversation,
    refetchOnMount: true, // Just for now because messages are very important and we want to make sure we have all of them
  });
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
  // messages: IConvosMessage[];
  newMessages: DecodedMessageWithCodecsType[];
  existingData?: IMessageAccumulator;
  prependNewMessages?: boolean;
}): IMessageAccumulator {
  const { newMessages, existingData, prependNewMessages = false } = args;

  const result: IMessageAccumulator = existingData
    ? { ...existingData }
    : {
        ids: [],
        byId: {},
        reactions: {},
      };

  // For now, we ignore messages with these content types
  const validMessages = newMessages.filter(
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

      if (prependNewMessages) {
        result.byId = { [messageId]: message, ...result.byId };
      } else {
        result.byId[messageId] = message;
      }
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

export function replaceOptimisticMessageWithReal(args: {
  tempId: string;
  topic: ConversationTopic;
  account: string;
  realMessage: DecodedMessageWithCodecsType;
}) {
  const { tempId, topic, account, realMessage } = args;
  logger.debug(
    "[linkOptimisticMessageToReal] linking optimistic message to real",
    {
      tempId,
      messageId: realMessage.id,
    }
  );

  queryClient.setQueryData(
    getConversationMessagesQueryOptions({ account, topic }).queryKey,
    (previousMessages) => {
      if (!previousMessages) {
        return {
          ids: [realMessage.id as MessageId],
          byId: {
            [realMessage.id as MessageId]: realMessage,
          },
          reactions: {},
        } satisfies IMessageAccumulator;
      }

      // Find the index of the temporary message
      const tempIndex = previousMessages.ids.indexOf(tempId as MessageId);

      if (tempIndex === -1) {
        return previousMessages;
      }

      // Create new ids array with the real message id replacing the temp id
      const newIds = [...previousMessages.ids];
      newIds[tempIndex] = realMessage.id as MessageId;

      // Add new message first, then spread existing byId
      const newById: IMessageAccumulator["byId"] = {
        [realMessage.id]: updateObjectAndMethods(realMessage, {
          // @ts-expect-error
          tempOptimisticId: tempId,
        }),
        ...previousMessages.byId,
      };
      // Remove the temporary message entry
      delete newById[tempId as MessageId];

      return {
        ...previousMessages,
        ids: newIds,
        byId: newById,
      };
    }
  );
}
