import { getConversationMessageQueryOptions } from "@/queries/useConversationMessage";
import { useConversationMessagesQuery } from "@/queries/conversation-messages-query";
import { useCurrentAccount } from "@data/store/accountsStore";
import { useQuery } from "@tanstack/react-query";
import { ConversationTopic, MessageId } from "@xmtp/react-native-sdk";
import logger from "@/utils/logger";

export function useConversationMessageById({
  messageId,
  conversationTopic,
}: {
  messageId: MessageId;
  conversationTopic: ConversationTopic;
}) {
  const currentAccount = useCurrentAccount()!;

  logger.debug("[useConversationMessageById] fetching message", {
    messageId,
    conversationTopic,
    currentAccount,
  });

  const { data: messages } = useConversationMessagesQuery({
    account: currentAccount,
    topic: conversationTopic,
    caller: "useConversationMessageById",
  });

  const cachedMessage = messages?.byId[messageId];

  logger.debug("[useConversationMessageById] cached message found", {
    hasCachedMessage: !!cachedMessage,
    messageId,
  });

  const { data: message, isLoading: isLoadingMessage } = useQuery({
    ...getConversationMessageQueryOptions({
      account: currentAccount,
      messageId,
    }),
    // Only fetch the message if it's not already in the conversation messages
    enabled: !cachedMessage && !!messageId && !!currentAccount,
  });

  logger.debug("[useConversationMessageById] query result", {
    hasMessage: !!message,
    isLoadingMessage,
    messageId,
  });

  return {
    message: message ?? cachedMessage,
    isLoading: !cachedMessage && isLoadingMessage,
  };
}
