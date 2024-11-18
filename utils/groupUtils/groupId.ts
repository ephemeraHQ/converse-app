import { ConversationId, ConversationTopic } from "@xmtp/react-native-sdk";

const V3_TOPIC_PREFIX = "/xmtp/mls/1/g-";

export const getV3IdFromTopic = (topic: ConversationTopic) => {
  return topic
    .replace(V3_TOPIC_PREFIX, "")
    .replace("/proto", "") as ConversationId;
};

export const isV3Topic = (topic: ConversationTopic) => {
  return topic.startsWith(V3_TOPIC_PREFIX);
};

export const getTopicFromV3Id = (conversationId: ConversationId) => {
  return `${V3_TOPIC_PREFIX}${conversationId}/proto` as ConversationTopic;
};
