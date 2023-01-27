import {
  Client,
  Conversation,
  DecodedMessage,
  SortDirection,
} from "@xmtp/xmtp-js";
import { getAddress } from "ethers/lib/utils";
import { spawnThread } from "react-native-multithreading";
import sleepSynchronously from "sleep-synchronously";

import "react-native-reanimated";
import config from "../config";

const env = config.xmtpEnv === "production" ? "production" : "dev";

export type TimestampByConversation = { [topic: string]: number };

export const getXmtpClientFromKeys = (keys: any) =>
  Client.create(null, {
    privateKeyOverride: Buffer.from(keys),
    env,
  });

export const getConversations = async (client: Client) => {
  const result = await spawnThread(() => {
    "worklet";
    console.log("waiting...");
    sleepSynchronously(3000);
    console.log("waited!");
    return 12;
  });
  console.log("fib is", result);
  // console.log("client.conversations.list...");
  // const conversations = await client.conversations.list();
  // console.log("returning conversations");
  return [];
};

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

export const streamNewConversations = async (
  client: Client,
  handleNewConversation: (conversation: Conversation) => void
) => {
  // Stream future conversations and send to expo
  // For each new conversation, load & stream messages
  const conversationStream = await client.conversations.stream();
  for await (const conversation of conversationStream) {
    handleNewConversation(conversation);
  }
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

export const buildContentTopic = (name: string): string =>
  `/xmtp/0/${name}/proto`;

export const buildUserInviteTopic = (walletAddr: string): string => {
  // EIP55 normalize the address case.
  return buildContentTopic(`invite-${getAddress(walletAddr)}`);
};
