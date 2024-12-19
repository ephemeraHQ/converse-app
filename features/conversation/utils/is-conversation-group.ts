import {
  ConversationWithCodecsType,
  GroupWithCodecsType,
} from "@/utils/xmtpRN/client.types";
import { ConversationVersion } from "@xmtp/react-native-sdk";

export function isConversationGroup(
  conversation: ConversationWithCodecsType
): conversation is GroupWithCodecsType {
  return conversation.version === ConversationVersion.GROUP;
}
