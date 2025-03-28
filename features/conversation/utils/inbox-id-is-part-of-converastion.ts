import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { getDmQueryData } from "@/features/dm/dm.query"
import { getGroupQueryData } from "@/features/groups/queries/group.query"
import { IXmtpConversationId, IXmtpInboxId } from "@/features/xmtp/xmtp.types"

export function inboxIdIsPartOfConversationUsingCacheData(args: {
  inboxId: IXmtpInboxId
  xmtpConversationId: IXmtpConversationId
}) {
  const { inboxId, xmtpConversationId } = args

  const group = getGroupQueryData({
    clientInboxId: getSafeCurrentSender().inboxId,
    xmtpConversationId,
  })

  const dm = getDmQueryData({
    clientInboxId: getSafeCurrentSender().inboxId,
    xmtpConversationId,
  })

  return dm?.peerInboxId === inboxId || group?.members?.ids.some((_inboxId) => _inboxId === inboxId)
}
