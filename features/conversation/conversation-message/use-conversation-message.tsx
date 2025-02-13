import { getConversationMessageQueryOptions } from "@/queries/useConversationMessage";
import { useConversationMessagesQuery } from "@/queries/conversation-messages-query";
import { useCurrentAccount } from "@/features/authentication/account.store";
import { useQuery } from "@tanstack/react-query";
import { ConversationTopic, MessageId } from "@xmtp/react-native-sdk";

export function useConversationMessageById(args: {
  messageId: MessageId;
  conversationTopic: ConversationTopic;
}) {
  const { messageId, conversationTopic } = args;

  const currentAccount = useCurrentAccount()!;

  const { data: messages } = useConversationMessagesQuery({
    account: currentAccount,
    topic: conversationTopic,
    caller: "useConversationMessageById",
  });

  const cachedMessage = messages?.byId[messageId];

  const { data: message, isLoading: isLoadingMessage } = useQuery({
    ...getConversationMessageQueryOptions({
      account: currentAccount,
      messageId,
    }),
    // Only fetch the message if it's not already in the conversation messages
    enabled: !cachedMessage && !!messageId && !!currentAccount,
  });

  return {
    message: message ?? cachedMessage,
    isLoading: !cachedMessage && isLoadingMessage,
  };
}
