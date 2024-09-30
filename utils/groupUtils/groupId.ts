const GROUP_TOPIC_PREFIX = "/xmtp/mls/1/g-";

export const getGroupIdFromTopic = (topic: string) => {
  return topic.replace(GROUP_TOPIC_PREFIX, "").replace("/proto", "");
};

export const isGroupTopic = (topic: string) => {
  return topic.startsWith(GROUP_TOPIC_PREFIX);
};

export const getTopicFromGroupId = (groupId: string) => {
  return `${GROUP_TOPIC_PREFIX}${groupId}/proto`;
};
