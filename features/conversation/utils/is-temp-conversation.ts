import { TEMP_CONVERSATION_PREFIX } from "@/features/conversation/conversation-create/mutations/create-conversation-and-send-first-message.mutation"
import { IConversationTopic } from "../conversation.types"

export function isTempConversation(topic: IConversationTopic) {
  return topic?.startsWith(TEMP_CONVERSATION_PREFIX)
}
