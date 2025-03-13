import { ConversationVersion } from "@xmtp/react-native-sdk"
import { IConversation } from "../conversation.types"

// Wether a conversation is blocked
export const isConversationBlocked = (conversation: IConversation) => {
  if (conversation.version === ConversationVersion.GROUP) {
    // TODO: Check if inboxId is blocked as well
    return conversation.state === "denied"
  } else {
    return conversation.state === "denied"
  }
}
