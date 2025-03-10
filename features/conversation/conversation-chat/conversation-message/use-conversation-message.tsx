import { useQuery } from "@tanstack/react-query"
import { ConversationTopic, MessageId } from "@xmtp/react-native-sdk"
import { useCurrentSenderEthAddress } from "@/features/authentication/multi-inbox.store"
import { useConversationMessagesQuery } from "@/features/conversation/conversation-chat/conversation-messages.query"
import { getConversationMessageQueryOptions } from "@/features/conversation/useConversationMessage"

export function useConversationMessageById(args: {
  messageId: MessageId
  conversationTopic: ConversationTopic
}) {
  const { messageId, conversationTopic } = args

  const currentAccount = useCurrentSenderEthAddress()!

  const { data: messages } = useConversationMessagesQuery({
    account: currentAccount,
    topic: conversationTopic,
    caller: "useConversationMessageById",
  })

  const cachedMessage = messages?.byId[messageId]

  const { data: message, isLoading: isLoadingMessage } = useQuery({
    ...getConversationMessageQueryOptions({
      account: currentAccount,
      messageId,
    }),
    // Only fetch the message if it's not already in the conversation messages
    enabled: !cachedMessage && !!messageId && !!currentAccount,
  })

  return {
    message: message ?? cachedMessage,
    isLoading: !cachedMessage && isLoadingMessage,
  }
}
