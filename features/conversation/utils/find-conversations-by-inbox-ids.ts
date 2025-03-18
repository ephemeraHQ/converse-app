import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { ensureAllowedConsentConversationsQueryData } from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import { getConversationsFromIds } from "@/features/conversation/utils/get-conversations"
import { isConversationDm } from "@/features/conversation/utils/is-conversation-dm"
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group"
import { isSameInboxId } from "@/features/xmtp/xmtp-inbox-id/xmtp-inbox-id.utils"

export async function findConversationByInboxIds(args: {
  inboxIds: IXmtpInboxId[]
  clientInboxId: IXmtpInboxId
}) {
  const { inboxIds, clientInboxId } = args

  if (inboxIds.length === 0) {
    return undefined
  }

  const conversationsIds = await ensureAllowedConsentConversationsQueryData({
    clientInboxId,
    caller: "findConversationByInboxIds",
  })

  const conversations = getConversationsFromIds({
    clientInboxId,
    conversationIds: conversationsIds,
  })

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

  const matchingDm = dms.find((dm) => {
    const peerInboxId = dm?.peerInboxId
    return peerInboxId && inboxIds.some((inboxId) => isSameInboxId(inboxId, peerInboxId))
  })

  return matchingDm
}
