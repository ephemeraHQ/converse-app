import { IConversationMessage } from "../conversation-message.types"

export function messageIsSent(message: IConversationMessage) {
  return message.status === "sent"
}

export function messageIsDelivered(message: IConversationMessage) {
  return message.status === "sent"
}
