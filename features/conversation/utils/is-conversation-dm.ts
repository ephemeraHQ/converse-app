import { ConversationVersion } from "@xmtp/react-native-sdk";
import {
  IXmtpConversationWithCodecs,
  IXmtpDmWithCodecs,
} from "@/features/xmtp/xmtp.types";

export function isConversationDm(
  conversation: IXmtpConversationWithCodecs,
): conversation is IXmtpDmWithCodecs {
  return conversation.version === ConversationVersion.DM;
}
