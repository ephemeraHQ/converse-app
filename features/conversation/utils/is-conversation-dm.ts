import {
  ConversationWithCodecsType,
  DmWithCodecsType,
} from "@/utils/xmtpRN/client";
import { ConversationVersion } from "@xmtp/react-native-sdk";

export function isConversationDm(
  conversation: ConversationWithCodecsType
): conversation is DmWithCodecsType {
  return conversation.version === ConversationVersion.DM;
}
