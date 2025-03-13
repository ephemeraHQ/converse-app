import { IConsentState } from "@/features/consent/consent.types"
import { IConversationMessage } from "@/features/conversation/conversation-chat/conversation-message/conversation-message.types"

export type IConversationType = "dm" | "group"

export type IConversationId = string & {
  readonly brand: unique symbol
}

export type IConversationTopic = string & {
  readonly brand: unique symbol
}

export type IConversation = {
  id: IConversationId
  createdAt: number
  type: IConversationType
  lastMessage?: IConversationMessage
  topic: IConversationTopic
  consentState: IConsentState
}
