import { useQuery } from "@tanstack/react-query"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { getConversationMetadataQueryOptions } from "@/features/conversation/conversation-metadata/conversation-metadata.query"
import { IConversationTopic } from "../../conversation.types"

export function useConversationIsPinned(args: { conversationTopic: IConversationTopic }) {
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
