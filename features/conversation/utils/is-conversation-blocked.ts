import { ConversationVersion } from "@xmtp/react-native-sdk";
import { IXmtpConversationWithCodecs } from "@/features/xmtp/xmtp.types";

// Wether a conversation is blocked
export const isConversationBlocked = (
  conversation: IXmtpConversationWithCodecs,
) => {
  if (conversation.version === ConversationVersion.GROUP) {
    // TODO: Check if inboxId is blocked as well
    return conversation.state === "denied";
  } else {
    return conversation.state === "denied";
  }
};
