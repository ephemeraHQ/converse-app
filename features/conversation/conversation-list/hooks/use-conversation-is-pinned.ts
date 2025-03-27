import { useQuery } from "@tanstack/react-query"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { getConversationMetadataQueryOptions } from "@/features/conversation/conversation-metadata/conversation-metadata.query"
import { IXmtpConversationId } from "@/features/xmtp/xmtp.types"

export function useConversationIsPinned(args: { xmtpConversationId: IXmtpConversationId }) {
  const { xmtpConversationId } = args

  const currentSender = useSafeCurrentSender()

  const { data: isPinned } = useQuery({
    ...getConversationMetadataQueryOptions({
      xmtpConversationId,
      clientInboxId: currentSender.inboxId,
    }),
    select: (data) => data?.pinned,
  })

  return {
    isPinned,
  }
}
