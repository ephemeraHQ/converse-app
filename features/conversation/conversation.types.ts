import { IConsentState } from "@/features/consent/consent.types"
import { IConversationMessage } from "@/features/conversation/conversation-chat/conversation-message/conversation-message.types"
import { IDm } from "@/features/dm/dm.types"
import { IGroup } from "@/features/groups/group.types"

export type IConversationType = "dm" | "group"

export type IConversationId = string & {
  readonly brand: unique symbol
}

export type IConversationTopic = string & {
  readonly brand: unique symbol
}

export type IConversationBase = {
  id: IConversationId
  createdAt: number
  type: IConversationType
  lastMessage?: IConversationMessage
  topic: IConversationTopic
  consentState: IConsentState
}

export type IConversation = IGroup | IDm
