export const getGroupIdFromTopic = (topic: string) => {
  return topic.replace("/xmtp/mls/1/g-", "").replace("/proto", "");
};
