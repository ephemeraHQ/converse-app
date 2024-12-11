import { useQuery } from "@tanstack/react-query";

import { isReactionMessage } from "@/features/conversation/conversation-message/conversation-message.utils";
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

type IReactionSignature = string; // Format: `${senderAddress}-${content}-${action}-${referenceMessageId}`

type IMessageAccumulator = {
  ids: MessageId[];
  byId: Record<MessageId, DecodedMessageWithCodecsType>;
  reactions: Record<
    MessageId,
    {
      bySender: Record<InboxId, ReactionContent[]>;
      byReactionContent: Record<string, InboxId[]>;
      latestReactionActions: Record<IReactionSignature, string>; // Track latest action instead of just signatures
    }
  >;
};

// function getReactionSignature(args: {
//   senderAddress: InboxId;
//   content: string;
//   action: string;
//   referenceMessageId: MessageId;
// }): IReactionSignature {
//   const { senderAddress, content, action, referenceMessageId } = args;
//   return `${senderAddress}-${content}-${action}-${referenceMessageId}`;
// }

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

  // First process regular messages
  for (const message of messages) {
    if (!isReactionMessage(message)) {
      const messageId = message.id as MessageId;
      result.byId[messageId] = message;
      if (prependNewMessages) {
        result.ids = [messageId, ...result.ids];
      } else if (!result.ids.includes(messageId)) {
        result.ids.push(messageId);
      }
    }
  }

  // Track which reactions we've already processed
  const processedReactions = new Set<string>();

  // Process reactions in reverse order (newest first)
  for (const message of messages) {
    if (!isReactionMessage(message)) {
      continue;
    }

    const reactionContent = message.content() as ReactionContent;
    const referenceMessageId = reactionContent?.reference as MessageId;
    const senderAddress = message.senderAddress as InboxId;

    if (!reactionContent || !referenceMessageId) {
      continue;
    }

    // Create a unique key for this sender + content combination
    const reactionKey = `${senderAddress}-${reactionContent.content}-${referenceMessageId}`;

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
        latestReactionActions: {},
      };
    }

    const messageReactions = result.reactions[referenceMessageId];

    if (reactionContent.action === "added") {
      messageReactions.byReactionContent[reactionContent.content] = [
        ...(messageReactions.byReactionContent[reactionContent.content] || []),
        senderAddress,
      ];
      messageReactions.bySender[senderAddress] = [
        ...(messageReactions.bySender[senderAddress] || []),
        reactionContent,
      ];
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

export const addConversationMessage = (
  account: string,
  topic: ConversationTopic,
  message: DecodedMessageWithCodecsType
) => {
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
