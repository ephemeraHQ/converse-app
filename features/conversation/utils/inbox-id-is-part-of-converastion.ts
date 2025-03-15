import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { getDmPeerInboxIdQueryData } from "@/features/dm/dm-peer-inbox-id.query"
import { getGroupMembersQueryData } from "@/features/groups/group-members.query"
import { IConversationTopic } from "../conversation.types"

export function inboxIdIsPartOfConversationUsingCacheData(args: {
  inboxId: IXmtpInboxId
  conversationTopic: IConversationTopic
}) {
  const { inboxId, conversationTopic } = args

  const members = getGroupMembersQueryData({
    clientInboxId: getSafeCurrentSender().inboxId,
    topic: conversationTopic,
  })

  const peerInboxId = getDmPeerInboxIdQueryData({
    inboxId: getSafeCurrentSender().inboxId,
    topic: conversationTopic,
  })

  return peerInboxId === inboxId || members?.ids.some((_inboxId) => _inboxId === inboxId)
}
