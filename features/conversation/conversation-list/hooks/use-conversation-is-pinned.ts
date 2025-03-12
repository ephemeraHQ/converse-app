import { useQuery } from "@tanstack/react-query"
import { ConversationTopic } from "@xmtp/react-native-sdk"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { getConversationMetadataQueryOptions } from "@/features/conversation/conversation-metadata/conversation-metadata.query"

export function useConversationIsPinned(args: { conversationTopic: ConversationTopic }) {
  const { conversationTopic } = args

  const currentSender = useSafeCurrentSender()

  const { data: isPinned } = useQuery({
    ...getConversationMetadataQueryOptions({
      topic: conversationTopic,
      clientInboxId: currentSender.inboxId,
    }),
    select: (data) => data?.pinned,
  })

  return {
    isPinned,
  }
}
