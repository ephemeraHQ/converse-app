import { IConversationId, IConversationTopic } from "../conversation.types"

const CONVERSATION_TOPIC_PREFIX = "/xmtp/mls/1/g-"

export const getConversationIdFromTopic = (topic: IConversationTopic): IConversationId => {
  return topic.replace(CONVERSATION_TOPIC_PREFIX, "").replace("/proto", "") as IConversationId
}
