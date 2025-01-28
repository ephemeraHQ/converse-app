import { ConversationWithCodecsType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";

export function isConversationAllowed(
  conversation: ConversationWithCodecsType
) {
  return conversation.state === "allowed";
}
