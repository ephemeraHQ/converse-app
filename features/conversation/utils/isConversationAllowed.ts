import { ConversationWithCodecsType } from "@/utils/xmtpRN/client.types";

export function isConversationAllowed(
  conversation: ConversationWithCodecsType
) {
  return conversation.state === "allowed";
}
