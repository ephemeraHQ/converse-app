import { IXmtpConversationWithCodecs } from "@/features/xmtp/xmtp.types";

export function isConversationAllowed(
  conversation: IXmtpConversationWithCodecs,
) {
  return conversation.state === "allowed";
}
