import { ConversationContext } from "@xmtp/react-native-sdk";

import { Conversation as DbConversation } from "../../data/db/entities/conversationEntity";
import { getPendingConversationsToCreate } from "../../data/helpers/conversations/pendingConversations";
import { saveConversations } from "../../data/helpers/conversations/upsertConversations";
import { useSettingsStore } from "../../data/store/accountsStore";
import { XmtpConversation } from "../../data/store/chatStore";
import { SettingsStoreType } from "../../data/store/settingsStore";
import { getTopicDataFromKeychain, saveTopicDataToKeychain } from "../keychain";
import { sentryTrackError } from "../sentry";
import {
  ConversationWithCodecsType,
  ConverseXmtpClientType,
  getXmtpClient,
} from "./client";
import { loadConversationsMessages } from "./messages";

const protocolConversationToStateConversation = (
  conversation: ConversationWithCodecsType
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
  messagesIds: [],
  conversationTitle: undefined,
  messageDraft: undefined,
  readUntil: 0,
  pending: false,
  version: conversation.version,
});

const protocolConversationsToTopicData = async (
  conversations: ConversationWithCodecsType[]
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
  [account: string]: { [topic: string]: ConversationWithCodecsType };
} = {};

const setOpenedConversation = (
  account: string,
  conversation: ConversationWithCodecsType
) => {
  openedConversations[account] = openedConversations[account] || {};
  openedConversations[account][conversation.topic] = conversation;
};

export const deleteOpenedConversations = (account: string) => {
  if (account in openedConversations) {
    delete openedConversations[account];
  }
};

const importTopicData = async (
  client: ConverseXmtpClientType,
  topics: string[]
) => {
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
  client: ConverseXmtpClientType,
  conversation: ConversationWithCodecsType
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
  loadConversationsMessages(client, { [conversation.topic]: 0 });
  setTimeout(() => {
    loadConversationsMessages(client, { [conversation.topic]: 0 });
  }, 3000);

  // Fetch consent from protocol
  client.contacts.refreshConsentList();
  await refreshPeersStatus([conversation]);
};

export const streamConversations = async (client: ConverseXmtpClientType) => {
  await stopStreamingConversations(client);
  client.conversations.stream((conversation) =>
    handleNewConversation(client, conversation)
  );
};

export const stopStreamingConversations = async (
  client: ConverseXmtpClientType
) => client.conversations.cancelStream();

const listConversations = async (client: ConverseXmtpClientType) => {
  const conversations = await client.conversations.list();
  conversations.forEach((c) => {
    setOpenedConversation(client.address, c);
  });
  return conversations;
};

export const loadConversations = async (
  client: ConverseXmtpClientType,
  knownTopics: string[]
) => {
  try {
    const now = new Date().getTime();
    const conversations = await listConversations(client);
    const newConversations: ConversationWithCodecsType[] = [];
    const knownConversations: ConversationWithCodecsType[] = [];
    conversations.forEach((c) => {
      if (!knownTopics.includes(c.topic)) {
        newConversations.push(c);
      } else {
        knownConversations.push(c);
      }
    });
    console.log(
      `[XmtpRN] Listing ${conversations.length} conversations for ${
        client.address
      } took ${(new Date().getTime() - now) / 1000} seconds`
    );
    const conversationsToSave = newConversations.map(
      protocolConversationToStateConversation
    );
    saveConversations(client.address, conversationsToSave);

    saveTopicDataToKeychain(
      client.address,
      await protocolConversationsToTopicData(newConversations)
    );

    // Refresh consent list from protocol
    // Note: refreshConsentList() will soon return the consent list
    // @todo once it does, save the dict to our app's peersStatus
    client.contacts.refreshConsentList();

    const uniquePeers = new Map();
    for (const conversation of conversations) {
      uniquePeers.set(conversation.peerAddress, conversation);
    }

    refreshPeersStatus(Array.from(uniquePeers.values()));

    return { newConversations, knownConversations };
  } catch (e) {
    const error = new Error();
    error.name = "LOAD_CONVERSATIONS_FAILED";
    error.message = `${e}`;
    throw error;
  }
};

const refreshPeersStatus = async (conversations: Conversation[]) => {
  const peersStatus: Pick<SettingsStoreType, "peersStatus">["peersStatus"] = {};

  for (const conversation of conversations) {
    // Using consentState() from the convo to avoid passing client
    // and calling client.contacts.isAllowed()/isDenied()
    const consentStatus = await conversation.consentState();

    if (consentStatus === "allowed") {
      peersStatus[conversation.peerAddress] = "consented";
    } else if (consentStatus === "denied") {
      peersStatus[conversation.peerAddress] = "blocked";
    }
    // 'unknown' status is ignored
  }

  if (Object.keys(peersStatus).length > 0) {
    useSettingsStore.getState().setPeersStatus(peersStatus);
  }
};

export const getConversationWithTopic = async (
  account: string,
  topic: string
): Promise<ConversationWithCodecsType | undefined> => {
  const alreadyConversation = openedConversations[account]?.[topic];
  if (alreadyConversation) return alreadyConversation;
  // Let's try to import from keychain if we don't have it already
  const client = await getXmtpClient(account);
  await importTopicData(client, [topic]);
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
