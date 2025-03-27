import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group"
import { IConversation } from "../conversation.types"

// Wether a conversation is blocked
export const isConversationBlocked = (conversation: IConversation) => {
  if (isConversationGroup(conversation)) {
    // TODO: Check if inboxId is blocked as well
    return conversation.consentState === "denied"
  } else {
    return conversation.consentState === "denied"
  }
}
