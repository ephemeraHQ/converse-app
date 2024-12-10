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

export const conversationMessagesQueryFn = async (
  conversation: ConversationWithCodecsType,
  options?: MessagesOptions
) => {
  logger.info("[useConversationMessages] queryFn fetching messages");

  if (!conversation) {
    throw new Error("Conversation not found in conversationMessagesQueryFn");
  }

  const messages = await conversation.messages(options);

  const ids: MessageId[] = [];
  const byId: Record<MessageId, DecodedMessageWithCodecsType> = {};
  const reactions: Record<
    MessageId,
    {
      bySender: Record<InboxId, ReactionContent[]>;
      byReactionContent: Record<string, InboxId[]>;
    }
  > = {};

  for (const message of messages) {
    if (!isReactionMessage(message)) {
      ids.push(message.id as MessageId);
      byId[message.id as MessageId] = message;
      continue;
    }

    const reactionContent = message.content() as ReactionContent;
    const referenceMessageId = reactionContent?.reference as MessageId;

    if (!reactionContent || !referenceMessageId) {
      continue;
    }

    if (!reactions[referenceMessageId]) {
      reactions[referenceMessageId] = {
        bySender: {},
        byReactionContent: {},
      };
    }

    const messageReactions = reactions[referenceMessageId];
    const senderAddress = message.senderAddress as InboxId;

    if (reactionContent.action === "added") {
      // Add sender to the list of users who used this reaction
      messageReactions.byReactionContent[reactionContent.content] = [
        ...(messageReactions.byReactionContent[reactionContent.content] || []),
        senderAddress,
      ];

      // Add reaction to sender's list of reactions
      messageReactions.bySender[senderAddress] = [
        ...(messageReactions.bySender[senderAddress] || []),
        reactionContent,
      ];
      continue;
    }

    if (reactionContent.action === "removed") {
      // Remove sender from the list of users who used this reaction
      messageReactions.byReactionContent[reactionContent.content] = (
        messageReactions.byReactionContent[reactionContent.content] || []
      ).filter((id) => id !== senderAddress);

      // Remove reaction from sender's list of reactions
      messageReactions.bySender[senderAddress] = (
        messageReactions.bySender[senderAddress] || []
      ).filter((reaction) => reaction.content !== reactionContent.content);
      continue;
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

export const addConversationMessage = (
  account: string,
  topic: ConversationTopic,
  message: DecodedMessageWithCodecsType
) => {
  queryClient.setQueryData<ConversationMessagesQueryData>(
    conversationMessagesQueryKey(account, topic),
    (previousMessages) => {
      if (!previousMessages) {
        return {
          ids: [message.id as MessageId],
          byId: { [message.id]: message },
          reactions: {},
        };
      }

      const newPreviousMessages = {
        ...previousMessages,
        byId: {
          ...previousMessages.byId,
          [message.id as MessageId]: message,
        },
        ids: [message.id as MessageId, ...previousMessages.ids],
      };

      if (isReactionMessage(message)) {
        const reactionContent = message.content() as ReactionContent;
        const reactionContentString = reactionContent.content;
        const referenceMessageId = reactionContent.reference as MessageId;
        const senderAddress = message.senderAddress as InboxId;

        const existingReactions = previousMessages.reactions[
          referenceMessageId
        ] || {
          bySender: {},
          byReactionContent: {},
        };

        newPreviousMessages.reactions = {
          ...previousMessages.reactions,
          [referenceMessageId]: {
            bySender: {
              ...existingReactions.bySender,
              [senderAddress]: [
                ...(existingReactions.bySender[senderAddress] || []),
                reactionContent,
              ],
            },
            byReactionContent: {
              ...existingReactions.byReactionContent,
              [reactionContentString]: [
                ...(existingReactions.byReactionContent[
                  reactionContentString
                ] || []),
                senderAddress,
              ],
            },
          },
        };
      }

      return newPreviousMessages;
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
