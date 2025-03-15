import { convertConsentStateToXmtpConsentState } from "@/features/consent/consent.utils"
import {
  IConversation,
  IConversationId,
  IConversationTopic,
} from "@/features/conversation/conversation.types"
import { IDm } from "@/features/dm/dm.types"
import { IGroup } from "@/features/groups/group.types"
import { convertXmtpGroupMemberToConvosMember } from "@/features/groups/utils/convert-xmtp-group-member-to-convos-member"
import { isXmtpConversationGroup } from "@/features/xmtp/xmtp-conversations/xmtp-conversation"
import { IXmtpConversationWithCodecs, IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { convertXmtpMessageToConvosMessage } from "../conversation-chat/conversation-message/utils/convert-xmtp-message-to-convos-message"

export async function convertXmtpConversationToConvosConversation(
  xmtpConversation: IXmtpConversationWithCodecs,
): Promise<IConversation> {
  if (isXmtpConversationGroup(xmtpConversation)) {
    const [members, creatorInboxId, consentState] = await Promise.all([
      xmtpConversation.members(),
      xmtpConversation.creatorInboxId(),
      xmtpConversation.consentState(),
    ])

    return {
      type: "group",
      id: xmtpConversation.id as unknown as IConversationId,
      topic: xmtpConversation.topic as unknown as IConversationTopic,
      consentState: convertConsentStateToXmtpConsentState(consentState),
      name: xmtpConversation.groupName,
      description: xmtpConversation.groupDescription,
      imageUrl: xmtpConversation.groupImageUrl,
      members: members.map(convertXmtpGroupMemberToConvosMember),
      creatorInboxId: creatorInboxId as unknown as IXmtpInboxId,
      addedByInboxId: xmtpConversation.addedByInboxId as unknown as IXmtpInboxId,
      createdAt: xmtpConversation.createdAt,
      lastMessage: xmtpConversation.lastMessage
        ? convertXmtpMessageToConvosMessage(xmtpConversation.lastMessage)
        : undefined,
    } as IGroup
  }

  // For DM conversations
  const [peerInboxId, consentState] = await Promise.all([
    xmtpConversation.peerInboxId(),
    xmtpConversation.consentState(),
  ])

  return {
    id: xmtpConversation.id as unknown as IConversationId,
    type: "dm",
    peerInboxId,
    createdAt: xmtpConversation.createdAt,
    topic: xmtpConversation.topic as unknown as IConversationTopic,
    consentState: convertConsentStateToXmtpConsentState(consentState),
    lastMessage: xmtpConversation.lastMessage
      ? convertXmtpMessageToConvosMessage(xmtpConversation.lastMessage)
      : undefined,
  } as IDm
}
