import { convertConsentStateToXmtpConsentState } from "@/features/consent/consent.utils"
import { IConversation } from "@/features/conversation/conversation.types"
import { IDm } from "@/features/dm/dm.types"
import { IGroup } from "@/features/groups/group.types"
import { convertXmtpGroupMemberToConvosMember } from "@/features/groups/utils/convert-xmtp-group-member-to-convos-member"
import { isXmtpConversationGroup } from "@/features/xmtp/xmtp-conversations/xmtp-conversation"
import { IXmtpConversationWithCodecs, IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { entify } from "@/utils/entify"
import { convertXmtpMessageToConvosMessage } from "../conversation-chat/conversation-message/utils/convert-xmtp-message-to-convos-message"

export async function convertXmtpConversationToConvosConversation(
  xmtpConversation: IXmtpConversationWithCodecs,
): Promise<IConversation> {
  // Group conversation
  if (isXmtpConversationGroup(xmtpConversation)) {
    const [members, creatorInboxId, consentState] = await Promise.all([
      xmtpConversation.members(),
      xmtpConversation.creatorInboxId() as unknown as IXmtpInboxId,
      xmtpConversation.consentState(),
    ])

    const addedByInboxId = xmtpConversation.addedByInboxId as unknown as IXmtpInboxId

    return {
      type: "group",
      xmtpId: xmtpConversation.id,
      xmtpTopic: xmtpConversation.topic,
      consentState: convertConsentStateToXmtpConsentState(consentState),
      name: xmtpConversation.groupName,
      description: xmtpConversation.groupDescription,
      imageUrl: xmtpConversation.groupImageUrl,
      members: entify(
        members.map(convertXmtpGroupMemberToConvosMember),
        (member) => member.inboxId,
      ),
      creatorInboxId: creatorInboxId,
      addedByInboxId,
      createdAt: xmtpConversation.createdAt,
      lastMessage: xmtpConversation.lastMessage
        ? convertXmtpMessageToConvosMessage(xmtpConversation.lastMessage)
        : undefined,
    } satisfies IGroup
  }

  // DM conversations
  const [peerInboxId, consentState] = await Promise.all([
    xmtpConversation.peerInboxId() as unknown as IXmtpInboxId,
    xmtpConversation.consentState(),
  ])

  return {
    type: "dm",
    peerInboxId: peerInboxId,
    xmtpId: xmtpConversation.id,
    createdAt: xmtpConversation.createdAt,
    xmtpTopic: xmtpConversation.topic,
    consentState: convertConsentStateToXmtpConsentState(consentState),
    lastMessage: xmtpConversation.lastMessage
      ? convertXmtpMessageToConvosMessage(xmtpConversation.lastMessage)
      : undefined,
  } satisfies IDm
}
