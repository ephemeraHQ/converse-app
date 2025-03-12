import { IXmtpConversationTopic } from "@features/xmtp/xmtp.types"
import { useQuery } from "@tanstack/react-query"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { getConversationMetadataQueryOptions } from "@/features/conversation/conversation-metadata/conversation-metadata.query"

export function useConversationIsDeleted(args: { conversationTopic: IXmtpConversationTopic }) {
  const { conversationTopic } = args

  const currentSender = useSafeCurrentSender()

  const { data: isDeleted } = useQuery({
    ...getConversationMetadataQueryOptions({
      clientInboxId: currentSender.inboxId,
      topic: conversationTopic,
    }),
    select: (data) => data?.deleted,
  })

  return {
    isDeleted,
  }
}
