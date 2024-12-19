import {
  ConversationWithCodecsType,
  DmWithCodecsType,
} from "@/utils/xmtpRN/client.types";
import { ConversationVersion } from "@xmtp/react-native-sdk";

export function isConversationDm(
  conversation: ConversationWithCodecsType
): conversation is DmWithCodecsType {
  return conversation.version === ConversationVersion.DM;
}
