import { IXmtpConversationTopic } from "@features/xmtp/xmtp.types"
import { TEMP_CONVERSATION_PREFIX } from "@/features/conversation/conversation-create/mutations/create-conversation-and-send-first-message.mutation"

export function isTempConversation(topic: IXmtpConversationTopic) {
  return topic?.startsWith(TEMP_CONVERSATION_PREFIX)
}
