import { useQuery } from "@tanstack/react-query"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { getConversationMetadataQueryOptions } from "@/features/conversation/conversation-metadata/conversation-metadata.query"
import { IXmtpConversationId } from "@/features/xmtp/xmtp.types"

export function useConversationIsDeleted(args: { xmtpConversationId: IXmtpConversationId }) {
  const { xmtpConversationId } = args

  const currentSender = useSafeCurrentSender()

  const { data: isDeleted } = useQuery({
    ...getConversationMetadataQueryOptions({
      clientInboxId: currentSender.inboxId,
      xmtpConversationId,
    }),
    select: (data) => data?.deleted,
  })

  return {
    isDeleted,
  }
}
