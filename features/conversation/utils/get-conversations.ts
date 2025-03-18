import { getConversationQueryData } from "@/features/conversation/queries/conversation.query"
import { IXmtpConversationId, IXmtpInboxId } from "@/features/xmtp/xmtp.types"

export function getConversationsFromIds({
  clientInboxId,
  conversationIds,
}: {
  clientInboxId: IXmtpInboxId
  conversationIds: IXmtpConversationId[]
}) {
  return conversationIds
    .map((conversationId) =>
      getConversationQueryData({ clientInboxId, xmtpConversationId: conversationId }),
    )
    .filter(Boolean)
}
