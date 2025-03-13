import { IConversation } from "../conversation.types"

export function isConversationDenied(conversation: IConversation) {
  return conversation.state === "denied"
}
