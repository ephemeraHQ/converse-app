import { ConversationTopic } from "@xmtp/react-native-sdk"
import { TEMP_CONVERSATION_PREFIX } from "@/features/conversation/conversation-create/hooks/use-create-conversation-and-send-first-message"

export function isTempConversation(topic: ConversationTopic) {
  return topic?.startsWith(TEMP_CONVERSATION_PREFIX)
}
