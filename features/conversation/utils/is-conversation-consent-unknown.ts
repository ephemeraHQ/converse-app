import { IXmtpConversationWithCodecs } from "@/features/xmtp/xmtp.types";

export function isConversationConsentUnknown(
  conversation: IXmtpConversationWithCodecs,
) {
  return conversation.state === "unknown";
}
