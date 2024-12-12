import { ConversationWithCodecsType } from "@/utils/xmtpRN/client";
import { ConversationVersion } from "@xmtp/react-native-sdk";

export function isConversationDm(conversation: ConversationWithCodecsType) {
  return conversation.version === ConversationVersion.DM;
}
