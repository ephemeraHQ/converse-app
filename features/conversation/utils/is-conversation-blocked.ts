import { ConversationWithCodecsType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import { ConversationVersion } from "@xmtp/react-native-sdk";

// Wether a conversation is blocked
export const isConversationBlocked = (
  conversation: ConversationWithCodecsType
) => {
  if (conversation.version === ConversationVersion.GROUP) {
    // TODO: Check if inboxId is blocked as well
    return conversation.state === "denied";
  } else {
    return conversation.state === "denied";
  }
};
