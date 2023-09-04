import { keystore } from "@xmtp/proto";
import { Client, Conversation } from "@xmtp/react-native-sdk";

import { saveConversations } from "../../data/helpers/conversations/upsertConversations";
import { XmtpConversation } from "../../data/store/chatStore";
import {
  ConversationWithKeyMaterial,
  saveConversationsToKeychain,
} from "../keychain";

const protocolConversationToStateConversation = (
  conversation: Conversation
): XmtpConversation => ({
  topic: conversation.topic,
  peerAddress: conversation.peerAddress,
  createdAt: conversation.createdAt,
  context: conversation.context
    ? {
        conversationId: conversation.context.conversationID,
        metadata: conversation.context.metadata,
      }
    : undefined,
  messages: new Map(),
  conversationTitle: undefined,
  messageDraft: undefined,
  readUntil: 0,
  pending: false,
});

const protocolConversationToKeychain = async (
  conversation: Conversation
): Promise<ConversationWithKeyMaterial> => {
  if (conversation.version === "v1") {
    return {
      version: "v1",
      peerAddress: conversation.peerAddress,
      createdAt: new Date(conversation.createdAt).toISOString(),
      topic: conversation.topic,
    };
  } else {
    const topicDataBase64 = await conversation.exportTopicData();
    const topicData = Buffer.from(topicDataBase64, "base64");
    const keyMaterialData =
      keystore.TopicMap_TopicData.decode(topicData).invitation
        ?.aes256GcmHkdfSha256?.keyMaterial;
    if (!keyMaterialData) {
      throw new Error(
        `Conversation ${conversation.topic} is v2 and should have key material`
      );
    }
    const keyMaterial = Buffer.from(keyMaterialData).toString("base64");
    return {
      context: conversation.context
        ? {
            conversationId: conversation.context.conversationID,
            metadata: conversation.context.metadata,
          }
        : undefined,
      version: "v2",
      topic: conversation.topic,
      peerAddress: conversation.peerAddress,
      createdAt: new Date(conversation.createdAt).toISOString(),
      keyMaterial,
    };
  }
};

const openedConversations: {
  [account: string]: { [topic: string]: Conversation };
} = {};

export const setOpenedConversation = (
  account: string,
  conversation: Conversation
) => {
  openedConversations[account] = openedConversations[account] || {};
  openedConversations[account][conversation.topic] = conversation;
};

export const streamConversations = async (client: Client) => {
  client.conversations.stream(async (conversation) => {
    setOpenedConversation(client.address, conversation);
    saveConversations(client.address, [
      protocolConversationToStateConversation(conversation),
    ]);
  });
};

export const loadConversations = async (
  client: Client,
  knownTopics: string[]
) => {
  try {
    const now = new Date().getTime();
    const conversations = await client.conversations.list();
    const newConversations: Conversation[] = [];
    const knownConversations: Conversation[] = [];
    conversations.forEach((c) => {
      setOpenedConversation(client.address, c);
      if (!knownTopics.includes(c.topic)) {
        newConversations.push(c);
      } else {
        knownConversations.push(c);
      }
    });
    console.log(
      `conversations.list() took ${
        (new Date().getTime() - now) / 1000
      } seconds for ${conversations.length} conversations`
    );
    const conversationsToSave = newConversations.map(
      protocolConversationToStateConversation
    );
    saveConversations(client.address, conversationsToSave);

    const conversationsWithKeys = await Promise.all(
      conversations.map(protocolConversationToKeychain)
    );
    saveConversationsToKeychain(client.address, conversationsWithKeys);

    return { newConversations, knownConversations };
  } catch (e) {
    const error = new Error();
    error.name = "LOAD_CONVERSATIONS_FAILED";
    error.message = `${e}`;
    throw error;
  }
};
