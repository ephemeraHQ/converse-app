import { ConversationWithCodecsType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";

export function isConversationDenied(conversation: ConversationWithCodecsType) {
  return conversation.state === "denied";
}
