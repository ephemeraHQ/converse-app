import { ConversationWithCodecsType } from "@/utils/xmtpRN/client";
import { ConversationVersion } from "@xmtp/react-native-sdk";

export function isConversationGroup(conversation: ConversationWithCodecsType) {
  return conversation.version === ConversationVersion.GROUP;
}
