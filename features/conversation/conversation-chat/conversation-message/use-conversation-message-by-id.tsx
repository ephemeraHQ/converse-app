import { useQuery } from "@tanstack/react-query"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { getConversationMessageQueryOptions } from "@/features/conversation/conversation-chat/conversation-message/conversation-message.query"
import { useConversationMessagesQuery } from "@/features/conversation/conversation-chat/conversation-messages.query"
import { IXmtpConversationTopic, IXmtpMessageId } from "@/features/xmtp/xmtp.types"

export function useConversationMessageById(args: {
  messageId: IXmtpMessageId
  conversationTopic: IXmtpConversationTopic
}) {
  const { messageId, conversationTopic } = args

  const currentSender = useSafeCurrentSender()

  const { data: messages } = useConversationMessagesQuery({
    clientInboxId: currentSender.inboxId,
    topic: conversationTopic,
    caller: "useConversationMessageById",
  })

  const cachedMessage = messages?.byId[messageId]

  const { data: message, isLoading: isLoadingMessage } = useQuery({
    ...getConversationMessageQueryOptions({
      clientInboxId: currentSender.inboxId,
      messageId,
    }),
    // Only fetch the message if it's not already in the conversation messages
    enabled: !cachedMessage && !!messageId && !!currentSender.inboxId,
  })

  return {
    message: message ?? cachedMessage,
    isLoading: !cachedMessage && isLoadingMessage,
  }
}
