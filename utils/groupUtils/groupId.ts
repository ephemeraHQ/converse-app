const V3_TOPIC_PREFIX = "/xmtp/mls/1/g-";

export const getV3IdFromTopic = (topic: string) => {
  return topic.replace(V3_TOPIC_PREFIX, "").replace("/proto", "");
};

export const isV3Topic = (topic: string) => {
  return topic.startsWith(V3_TOPIC_PREFIX);
};

export const getTopicFromV3Id = (conversationId: string) => {
  return `${V3_TOPIC_PREFIX}${conversationId}/proto`;
};
