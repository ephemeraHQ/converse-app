import { IXmtpConversationId } from "@/features/xmtp/xmtp.types"

export const TEMP_CONVERSATION_PREFIX = "tmp-"

export function isTempConversation(xmtpConversationId: IXmtpConversationId) {
  return xmtpConversationId?.startsWith(TEMP_CONVERSATION_PREFIX)
}
