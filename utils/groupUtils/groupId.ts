import { ConversationId, ConversationTopic } from "@xmtp/react-native-sdk";

const V3_TOPIC_PREFIX = "/xmtp/mls/1/g-";

export const getV3IdFromTopic = (topic: ConversationTopic): ConversationId => {
  return topic
    .replace(V3_TOPIC_PREFIX, "")
    .replace("/proto", "") as ConversationId;
};

/**
 * Checks if a topic string is a valid V3 conversation topic
 *
 * Validates that input is a non-empty string and starts with
 * the V3 topic prefix "/xmtp/mls/1/g-"
 *
 * @param {string} topic - Topic string to validate
 * @returns {boolean} True if valid V3 topic, false otherwise
 *
 * @example
 * // Returns true
 * isV3Topic("/xmtp/mls/1/g-abc123/proto")
 *
 * @example
 * // Returns false
 * isV3Topic("invalid-topic")
 */
export const isV3Topic = (topic: string): topic is ConversationTopic => {
  if (!topic || typeof topic !== "string") {
    return false;
  }
  return topic.startsWith(V3_TOPIC_PREFIX);
};

export const getTopicFromV3Id = (
  conversationId: ConversationId
): ConversationTopic => {
  if (!isV3Topic(conversationId)) {
    throw new Error("Invalid V3 topic");
  }
  return `${V3_TOPIC_PREFIX}${conversationId}/proto` as ConversationTopic;
};
