import { ConversationWithCodecsType } from "@/utils/xmtpRN/client/client.types";

export function isConversationDenied(conversation: ConversationWithCodecsType) {
  return conversation.state === "denied";
}
