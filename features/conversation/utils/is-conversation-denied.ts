import { ConversationWithCodecsType } from "@/utils/xmtpRN/client.types";

export function isConversationDenied(conversation: ConversationWithCodecsType) {
  return conversation.state === "denied";
}
