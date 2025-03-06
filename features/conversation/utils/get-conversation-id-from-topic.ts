import { ConversationId, ConversationTopic } from "@xmtp/react-native-sdk"

const CONVERSATION_TOPIC_PREFIX = "/xmtp/mls/1/g-"

export const getConversationIdFromTopic = (topic: ConversationTopic): ConversationId => {
  return topic.replace(CONVERSATION_TOPIC_PREFIX, "").replace("/proto", "") as ConversationId
}
