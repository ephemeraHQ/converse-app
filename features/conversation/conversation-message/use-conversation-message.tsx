import { getConversationMessageQueryOptions } from "@/queries/useConversationMessage";
import { useConversationMessages } from "@/queries/use-conversation-messages-query";
import { useCurrentAccount } from "@data/store/accountsStore";
import { useQuery } from "@tanstack/react-query";
import { ConversationTopic, MessageId } from "@xmtp/react-native-sdk";

export function useConversationMessageById({
  messageId,
  conversationTopic,
}: {
  messageId: MessageId;
  conversationTopic: ConversationTopic;
}) {
  const currentAccount = useCurrentAccount()!;
  const { data: messages } = useConversationMessages(
    currentAccount,
    conversationTopic
  );

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
