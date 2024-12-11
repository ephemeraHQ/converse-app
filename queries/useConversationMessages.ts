import { useQuery } from "@tanstack/react-query";
import { isReactionMessage } from "@/features/conversation/conversation-message/conversation-message.utils";
import { contentTypesPrefixes } from "@/utils/xmtpRN/content-types/content-types";
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
import { cacheOnlyQueryOptions } from "./cacheOnlyQueryOptions";
import { queryClient } from "./queryClient";
import { useConversationQuery } from "./useConversationQuery";

export type ConversationMessagesQueryData = Awaited<
  ReturnType<typeof conversationMessagesQueryFn>
>;

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

      // WIP
      // Find matching optimistic message using correlationId from message root
      // const optimisticMessage = optimisticMessages.find(
      //   (msg) => msg.messageId === message.id
      // );

      // if (optimisticMessage) {
      //   // Remove the optimistic message from tracking and from the result
      //   removeOptimisticMessage(messageId);
      //   // Remove from the query data
      //   result.ids = result.ids.filter((id) => id !== optimisticMessage.tempId);
      //   delete result.byId[optimisticMessage.tempId as MessageId];
      // }

      // Add the new message
      result.byId[messageId] = message;
      if (prependNewMessages) {
        result.ids = [messageId, ...result.ids];
      } else if (!result.ids.includes(messageId)) {
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
  return conversationMessagesQueryFn(conversation!);
};

export const useConversationMessages = (
  account: string,
  topic: ConversationTopic
) => {
  const { data: conversation } = useConversationQuery(
    account,
    topic,
    cacheOnlyQueryOptions
  );

  return useQuery({
    queryKey: conversationMessagesQueryKey(account, topic),
    queryFn: async () => {
      return conversationMessagesQueryFn(conversation!);
    },
    enabled: !!conversation,
  });
};

export const getConversationMessages = (
  account: string,
  topic: ConversationTopic
) => {
  return queryClient.getQueryData<ConversationMessagesQueryData>(
    conversationMessagesQueryKey(account, topic)
  );
};

export function refetchConversationMessages(
  account: string,
  topic: ConversationTopic
) {
  return queryClient.refetchQueries({
    queryKey: conversationMessagesQueryKey(account, topic),
  });
}

export const addConversationMessage = (args: {
  account: string;
  topic: ConversationTopic;
  message: DecodedMessageWithCodecsType;
  // isOptimistic?: boolean;
}) => {
  const {
    account,
    topic,
    message,
    // isOptimistic
  } = args;

  // WIP
  // if (isOptimistic) {
  //   addOptimisticMessage(message.id);
  // }

  queryClient.setQueryData<ConversationMessagesQueryData>(
    conversationMessagesQueryKey(account, topic),
    (previousMessages) => {
      return processMessages({
        messages: [message],
        existingData: previousMessages,
        prependNewMessages: true,
      });
    }
  );
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

// WIP
// type IOptimisticMessage = {
//   tempId: string;
//   messageId?: MessageId;
// };

// // Keep track of optimistic messages
// let optimisticMessages: IOptimisticMessage[] = [];

// function addOptimisticMessage(tempId: string) {
//   optimisticMessages.push({
//     tempId,
//   });
// }

// function removeOptimisticMessage(messageId: MessageId) {
//   optimisticMessages = optimisticMessages.filter(
//     (msg) => msg.messageId !== messageId
//   );
// }

// export function updateConversationMessagesOptimisticMessages(
//   tempId: string,
//   messageId: MessageId
// ) {
//   const optimisticMessage = optimisticMessages.find(
//     (msg) => msg.tempId === tempId
//   );
//   if (optimisticMessage) {
//     optimisticMessage.messageId = messageId;
//   }
// }
