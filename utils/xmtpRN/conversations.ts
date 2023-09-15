import {
  Client,
  Conversation,
  ConversationContext,
} from "@xmtp/react-native-sdk";

import { Conversation as DbConversation } from "../../data/db/entities/conversationEntity";
import { getPendingConversationsToCreate } from "../../data/helpers/conversations/pendingConversations";
import { saveConversations } from "../../data/helpers/conversations/upsertConversations";
import { XmtpConversation } from "../../data/store/chatStore";
import { getTopicDataFromKeychain, saveTopicDataToKeychain } from "../keychain";
import { sentryTrackError } from "../sentry";
import { getXmtpClient } from "./client";
import { loadConversationsMessages } from "./messages";

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

const protocolConversationsToTopicData = async (
  conversations: Conversation[]
): Promise<{ [topic: string]: string }> => {
  const topicWithTopicData: { [topic: string]: string } = {};
  const topicDatas = await Promise.all(
    conversations.map((c) => c.exportTopicData())
  );
  conversations.forEach((c, i) => {
    const topicData = topicDatas[i];
    topicWithTopicData[c.topic] = topicData;
  });
  return topicWithTopicData;
};

const openedConversations: {
  [account: string]: { [topic: string]: Conversation };
} = {};

const setOpenedConversation = (account: string, conversation: Conversation) => {
  openedConversations[account] = openedConversations[account] || {};
  openedConversations[account][conversation.topic] = conversation;
};

export const deleteOpenedConversations = (account: string) => {
  if (account in openedConversations) {
    delete openedConversations[account];
  }
};

const importedTopicDataByAccount: { [account: string]: boolean } = {};
export const deleteImportedTopicData = (account: string) => {
  if (account in importedTopicDataByAccount) {
    delete importedTopicDataByAccount[account];
  }
};

export const importTopicData = async (client: Client, topics: string[]) => {
  if (client.address in importedTopicDataByAccount) return;
  importedTopicDataByAccount[client.address] = true;
  // If we have topics for this account, let's import them
  // so the first conversation.list() is faster
  const beforeImport = new Date().getTime();
  const topicsData = await getTopicDataFromKeychain(client.address, topics);
  if (topicsData.length > 0) {
    try {
      const importedConversations = await Promise.all(
        topicsData.map((data) => client.conversations.importTopicData(data))
      );
      importedConversations.forEach((conversation) => {
        setOpenedConversation(client.address, conversation);
      });
      const afterImport = new Date().getTime();
      console.log(
        `[XmtpRN] Imported ${
          topicsData.length
        } exported conversations into client in ${
          (afterImport - beforeImport) / 1000
        }s`
      );
    } catch (e) {
      console.log(e);
      // It's ok if import failed it will just be slower
      sentryTrackError(e);
    }
  }
};

const handleNewConversation = async (
  client: Client,
  conversation: Conversation
) => {
  setOpenedConversation(client.address, conversation);
  saveConversations(client.address, [
    protocolConversationToStateConversation(conversation),
  ]);
  saveTopicDataToKeychain(
    client.address,
    await protocolConversationsToTopicData([conversation])
  );
  // New conversations are not streamed immediatly
  // by the streamAllMessages method so we add this
  // trick to try and be all synced
  loadConversationsMessages(client, [conversation], 0);
  setTimeout(() => {
    loadConversationsMessages(client, [conversation], 0);
  }, 3000);
};

export const streamConversations = async (client: Client) => {
  await stopStreamingConversations(client);
  client.conversations.stream((conversation) =>
    handleNewConversation(client, conversation)
  );
};

export const stopStreamingConversations = async (client: Client) =>
  client.conversations.cancelStream();

const listConversations = async (client: Client) => {
  const conversations = await client.conversations.list();
  conversations.forEach((c) => {
    setOpenedConversation(client.address, c);
  });
  return conversations;
};

export const loadConversations = async (
  client: Client,
  knownTopics: string[]
) => {
  try {
    const now = new Date().getTime();
    const conversations = await listConversations(client);
    const newConversations: Conversation[] = [];
    const knownConversations: Conversation[] = [];
    conversations.forEach((c) => {
      if (!knownTopics.includes(c.topic)) {
        newConversations.push(c);
      } else {
        knownConversations.push(c);
      }
    });
    console.log(
      `[XmtpRN] Listing ${conversations.length} conversations took ${
        (new Date().getTime() - now) / 1000
      } seconds`
    );
    const conversationsToSave = newConversations.map(
      protocolConversationToStateConversation
    );
    saveConversations(client.address, conversationsToSave);

    saveTopicDataToKeychain(
      client.address,
      await protocolConversationsToTopicData(conversations)
    );

    return { newConversations, knownConversations };
  } catch (e) {
    const error = new Error();
    error.name = "LOAD_CONVERSATIONS_FAILED";
    error.message = `${e}`;
    throw error;
  }
};

export const getConversationWithTopic = (
  account: string,
  topic: string
): Conversation | undefined => {
  return openedConversations[account]?.[topic];
};

const createConversation = async (
  account: string,
  dbConversation: DbConversation
) => {
  if (!dbConversation.pending) {
    throw new Error("Can only create a conversation that is pending");
  }
  console.log(
    `[XMTP] Creating a conversation with peer ${dbConversation.peerAddress} and id ${dbConversation.contextConversationId}`
  );
  const client = await getXmtpClient(account);
  let context: ConversationContext | undefined = undefined;
  if (dbConversation.contextConversationId) {
    context = {
      conversationID: dbConversation.contextConversationId,
      metadata: dbConversation.contextMetadata
        ? JSON.parse(dbConversation.contextMetadata)
        : {},
    };
  }
  const newConversation = await client.conversations.newConversation(
    dbConversation.peerAddress,
    context
  );
  handleNewConversation(client, newConversation);
  return newConversation.topic;
};

export const createPendingConversations = async (account: string) => {
  const pendingConvos = await getPendingConversationsToCreate(account);
  if (pendingConvos.length === 0) return;
  console.log(
    `Trying to create ${pendingConvos.length} pending conversations...`
  );
  await Promise.all(pendingConvos.map((c) => createConversation(account, c)));
};
