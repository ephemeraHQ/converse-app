import { IConversation } from "../conversation.types"

export function isConversationConsentUnknown(conversation: IConversation) {
  return conversation.state === "unknown"
}
