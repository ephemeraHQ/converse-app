import {
  Client,
  Conversation,
  DecodedMessage,
  Signer,
  SortDirection,
} from "@xmtp/xmtp-js";
import {
  ConversationV2 as ConversationV2Type,
  ConversationV1 as ConversationV1Type,
} from "@xmtp/xmtp-js/dist/types/src/conversations";
import { getAddress } from "ethers/lib/utils";

import config from "../config";

const {
  ConversationV1,
  ConversationV2,
} = require("@xmtp/xmtp-js/dist/esm/src/conversations/Conversation");
const env = config.xmtpEnv === "production" ? "production" : "dev";

export type TimestampByConversation = { [topic: string]: number };

export const isOnXmtp = async (address: string) =>
  Client.canMessage(address, {
    env,
  });

export const getXmtpClientFromKeys = (keys: any) =>
  Client.create(null, {
    privateKeyOverride: Buffer.from(keys),
    env,
  });

export const getXmtpKeysFromSigner = (signer: Signer) =>
  Client.getKeys(signer, {
    env,
  });

export const getConversations = async (client: Client) => {
  const conversations = await client.conversations.list();
  return conversations;
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

export const getXmtpSignature = async (client: Client, message: string) => {
  const messageToSign = Buffer.from(message);
  const encodedMessage = (
    await client.keys.identityKey.sign(messageToSign)
  ).toBytes();
  return Buffer.from(encodedMessage).toString("base64");
};

export const instantiateXmtpConversationFromJSON = async (
  xmtpClient: Client,
  savedConversation: string
): Promise<Conversation> => {
  let parsedConversation: any = {};
  try {
    parsedConversation = JSON.parse(savedConversation);
  } catch (e: any) {
    console.log(e);
    throw new Error("Could not parse saved conversation");
  }
  if (parsedConversation.version === "v1") {
    const conversationV1: ConversationV1Type = ConversationV1.fromExport(
      xmtpClient,
      parsedConversation
    );
    return conversationV1;
  } else if (parsedConversation.version === "v2") {
    const conversationV2: ConversationV2Type = ConversationV2.fromExport(
      xmtpClient,
      parsedConversation
    );
    return conversationV2;
  }
  throw new Error(
    `Conversation version ${parsedConversation.version} not handled`
  );
};
