import { IConversation } from "../conversation.types"

export function isConversationAllowed(conversation: IConversation) {
  return conversation.consentState === "allowed"
}
