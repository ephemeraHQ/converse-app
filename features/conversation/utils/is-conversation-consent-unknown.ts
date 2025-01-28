import { ConversationWithCodecsType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";

export function isConversationConsentUnknown(
  conversation: ConversationWithCodecsType
) {
  return conversation.state === "unknown";
}
