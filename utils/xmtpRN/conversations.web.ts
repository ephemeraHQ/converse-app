import { ConversationWithLastMessagePreview } from "@utils/conversation";
import logger from "@utils/logger";
import { Client, ConsentListEntry, Conversation, Stream } from "@xmtp/xmtp-js";

import { syncConversationsMessages } from "./messages";
import { getXmtpClient } from "./sync";
import { saveConversations } from "../../data/helpers/conversations/upsertConversations";
import { getChatStore, getSettingsStore } from "../../data/store/accountsStore";
import { XmtpConversation } from "../../data/store/chatStore";
import { SettingsStoreType } from "../../data/store/settingsStore";
import { getCleanAddress } from "../evm/address";

const protocolConversationToStateConversation = (
  conversation: Conversation
): XmtpConversation => ({
  topic: conversation.topic,
  peerAddress: conversation.peerAddress,
  createdAt: conversation.createdAt.getTime(),
  context: conversation.context || undefined,
  messages: new Map(),
  messagesIds: [],
  messageDraft: undefined,
  mediaPreview: undefined,
  readUntil: 0,
  pending: false,
  version: conversation.conversationVersion,
  isGroup: false,
});

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

const handleNewConversation = async (
  client: Client,
  conversation: Conversation
) => {
  setOpenedConversation(client.address, conversation);
  saveConversations(client.address, [
    protocolConversationToStateConversation(conversation),
  ]);
  // New conversations are not streamed immediatly
  // by the streamAllMessages method so we add this
  // trick to try and be all synced
  syncConversationsMessages(client.address, { [conversation.topic]: 0 });
  setTimeout(() => {
    syncConversationsMessages(client.address, { [conversation.topic]: 0 });
  }, 3000);
  updateConsentStatus(client.address);
};

const conversationsStreams: {
  [account: string]: Stream<Conversation<any>, any>;
} = {};

export const streamConversations = async (account: string) => {
  await stopStreamingConversations(account);
  const client = (await getXmtpClient(account)) as Client;
  conversationsStreams[account] = await client.conversations.stream();
  for await (const conversation of conversationsStreams[account]) {
    handleNewConversation(client, conversation);
  }
};

export const stopStreamingConversations = async (account: string) => {
  if (conversationsStreams[account]) {
    await conversationsStreams[account].return();
    delete conversationsStreams[account];
  }
};

const listConversations = async (client: Client) => {
  const conversations = await client.conversations.list();
  conversations.forEach((c) => {
    setOpenedConversation(client.address, c);
  });
  return conversations;
};

export const loadConversations = async (
  account: string,
  knownTopics: string[]
) => {
  try {
    const client = (await getXmtpClient(account)) as Client;
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
    logger.debug(
      `[XmtpJS] Listing ${conversations.length} conversations for ${
        client.address
      } took ${(new Date().getTime() - now) / 1000} seconds`
    );
    // @todo => Maybe just save to mmkv no need to
    // re-save all convos?
    const conversationsToSave = conversations.map(
      protocolConversationToStateConversation
    );
    saveConversations(client.address, conversationsToSave);

    return { newConversations, knownConversations };
  } catch (e) {
    const error = new Error();
    error.name = "LOAD_CONVERSATIONS_FAILED";
    error.message = `${e}`;
    throw error;
  }
};

export const updateConsentStatus = async (account: string) => {
  try {
    const client = (await getXmtpClient(account)) as Client;
    const consentList = await client.contacts.refreshConsentList();
    await saveConsentState(consentList, client.address);
  } catch (error) {
    logger.error(error, { context: "Failed to update consent status" });
  }
};

const saveConsentState = async (
  consentList: ConsentListEntry[],
  account: string
) => {
  const peersStatus: SettingsStoreType["peersStatus"] = {};

  consentList.forEach((entry) => {
    if (entry.entryType === "address") {
      if (entry.permissionType === "allowed") {
        peersStatus[entry.value] = "consented";
      } else if (entry.permissionType === "denied") {
        peersStatus[entry.value] = "blocked";
      }
    }
  });

  if (Object.keys(peersStatus).length > 0) {
    getSettingsStore(account).getState().setPeersStatus(peersStatus);
  }
};

export const consentToPeersOnProtocol = async (
  account: string,
  peers: string[],
  consent: "allow" | "deny"
) => {
  try {
    const cleanPeers = peers.map((peer) => getCleanAddress(peer));
    const client = (await getXmtpClient(account)) as Client;

    if (consent === "allow") {
      await client.contacts.allow(cleanPeers);
    } else if (consent === "deny") {
      await client.contacts.deny(cleanPeers);
    } else {
      throw new Error(`Invalid consent type: ${consent}`);
    }
  } catch (error) {
    logger.error(error, { context: "Error updating consent" });
  }
};

export const getConversationWithTopic = async (
  account: string,
  topic: string
): Promise<Conversation | undefined> => {
  const alreadyConversation = openedConversations[account]?.[topic];
  return alreadyConversation;
};

const createConversation = async (
  account: string,
  conversation: XmtpConversation
) => {
  if (!conversation.pending) {
    throw new Error("Can only create a conversation that is pending");
  }
  logger.debug(
    `[XMTP] Creating a conversation with peer ${conversation.peerAddress} and id ${conversation.context?.conversationId}`
  );
  const client = (await getXmtpClient(account)) as Client;

  // Groups not handled on web
  if (!conversation.peerAddress) return;

  const newConversation = await client.conversations.newConversation(
    conversation.peerAddress,
    conversation.context
  );
  handleNewConversation(client, newConversation);
  return newConversation.topic;
};

export const createPendingConversations = async (account: string) => {
  const pendingConvos = Object.values(
    getChatStore(account).getState().conversations
  ).filter((c) => c.pending && c.messages?.size > 0);
  if (pendingConvos.length === 0) return;
  logger.debug(
    `Trying to create ${pendingConvos.length} pending conversations...`
  );
  await Promise.all(pendingConvos.map((c) => createConversation(account, c)));
};

export const loadConversationsHmacKeys = async (account: string) => {};

export const sortRequestsBySpamScore = (
  requests: ConversationWithLastMessagePreview[]
) => {
  const result = {
    likelyNotSpam: [] as ConversationWithLastMessagePreview[],
    likelySpam: [] as ConversationWithLastMessagePreview[],
  };

  requests.forEach((conversation) => {
    const isLikelyNotSpam =
      conversation.spamScore !== undefined &&
      (conversation.spamScore === null || conversation.spamScore < 1);

    if (isLikelyNotSpam) {
      result.likelyNotSpam.push(conversation);
    } else {
      result.likelySpam.push(conversation);
    }
  });

  return result;
};
