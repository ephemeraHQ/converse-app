import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { getDmPeerInboxIdQueryData } from "@/features/dm/dm-peer-inbox-id.query"
import { getGroupQueryData } from "@/features/groups/group.query"
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

  const peerInboxId = getDmPeerInboxIdQueryData({
    inboxId: getSafeCurrentSender().inboxId,
    xmtpConversationId,
  })

  return peerInboxId === inboxId || group?.members?.ids.some((_inboxId) => _inboxId === inboxId)
}
