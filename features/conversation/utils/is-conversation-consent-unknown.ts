import { ConversationWithCodecsType } from "@/utils/xmtpRN/client.types";

export function isConversationConsentUnknown(
  conversation: ConversationWithCodecsType
) {
  return conversation.state === "unknown";
}
