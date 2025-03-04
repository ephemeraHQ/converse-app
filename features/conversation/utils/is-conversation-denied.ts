import { IXmtpConversationWithCodecs } from "@/features/xmtp/xmtp.types"

export function isConversationDenied(conversation: IXmtpConversationWithCodecs) {
  return conversation.state === "denied"
}
