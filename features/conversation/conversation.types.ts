import { IConsentState } from "@/features/consent/consent.types"
import { IConversationMessage } from "@/features/conversation/conversation-chat/conversation-message/conversation-message.types"
import { IDm } from "@/features/dm/dm.types"
import { IGroup } from "@/features/groups/group.types"
import { IXmtpConversationId, IXmtpConversationTopic } from "@/features/xmtp/xmtp.types"

export type IConversationType = "dm" | "group"

// Not needed
// export type IConversationId = string & {
//   readonly brand: unique symbol
// }

// We don't really need a topic here so we can just reuse the xmtp topic type
export type IConversationTopic = IXmtpConversationTopic

export type IConversationBase = {
  // id: IConversationId // Not needed
  createdAt: number
  type: IConversationType
  xmtpTopic: IConversationTopic
  xmtpId: IXmtpConversationId
  consentState: IConsentState
  lastMessage: IConversationMessage | undefined
}

export type IConversation = IGroup | IDm
