import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { getAllowedConsentConversationsQueryOptions } from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import { isConversationDm } from "@/features/conversation/utils/is-conversation-dm"
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group"
import { ensureDmPeerInboxIdQueryData } from "@/features/dm/dm-peer-inbox-id.query"
import { isSameInboxId } from "@/features/xmtp/xmtp-inbox-id/xmtp-inbox-id.utils"
import { reactQueryClient } from "@/utils/react-query/react-query.client"

export async function findConversationByInboxIds(args: {
  inboxIds: IXmtpInboxId[]
  clientInboxId: IXmtpInboxId
}) {
  const { inboxIds, clientInboxId } = args

  if (inboxIds.length === 0) {
    return undefined
  }

  const conversations = await reactQueryClient.ensureQueryData(
    getAllowedConsentConversationsQueryOptions({
      clientInboxId,
      caller: "findConversationByMembers",
    }),
  )

  if (!conversations) {
    return undefined
  }

  const groups = conversations.filter(isConversationGroup)
  const dms = conversations.filter(isConversationDm)

  // Check if we have a group with all the selected inboxIds
  const matchingGroup = groups.find((group) => {
    const groupMembersInboxIds = group.members.ids
    if (!groupMembersInboxIds) return false

    // Need only groups with exactly the same number of members as inboxIds
    if (groupMembersInboxIds.length !== inboxIds.length) return false

    // Then check that every memberId matches either currentUserInboxId or one of inboxIds
    return groupMembersInboxIds.every((groupMemberInboxId) =>
      inboxIds.some((inboxId) => isSameInboxId(groupMemberInboxId, inboxId)),
    )
  })

  // If we found a group or if we're looking for a group but didn't find one
  if (matchingGroup || inboxIds.length > 2) {
    return matchingGroup
  }

  // For DMs, only check if we have a single inboxId
  const dmPeerInboxIds = await Promise.all(
    dms.map((dm) =>
      ensureDmPeerInboxIdQueryData({
        inboxId: clientInboxId,
        xmtpConversationId: dm.xmtpId,
        caller: "findConversationByMembers",
      }),
    ),
  )

  const matchingDm = dms.find((_, index) => {
    const peerInboxId = dmPeerInboxIds[index]
    return peerInboxId && inboxIds.some((inboxId) => isSameInboxId(inboxId, peerInboxId))
  })

  return matchingDm
}
