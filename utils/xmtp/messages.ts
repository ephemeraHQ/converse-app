import {
  Client,
  Conversation,
  DecodedMessage,
  SortDirection,
} from "@xmtp/xmtp-js";

export const getNewConversationMessages = async (
  conversation: Conversation,
  lastTimestamp?: number
) => {
  // Loads all messages and sends to Expo
  const messages = await conversation.messages({
    direction: SortDirection.SORT_DIRECTION_ASCENDING,
    startTime: lastTimestamp ? new Date(lastTimestamp) : undefined,
  });
  if (
    messages.length > 1 ||
    (messages.length === 1 && lastTimestamp !== messages[0].sent.getTime())
  ) {
    return messages;
  }
  return [];
};

export const streamAllMessages = async (
  client: Client,
  handleNewMessage: (message: DecodedMessage) => void
) => {
  // Stream future messages and sends to expo
  const stream = await client.conversations.streamAllMessages();
  for await (const m of stream) {
    handleNewMessage(m);
  }
};
