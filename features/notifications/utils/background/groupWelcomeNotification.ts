export const isGroupWelcomeContentTopic = (contentTopic: string) => {
  return contentTopic.startsWith("/xmtp/mls/1/w-");
};
