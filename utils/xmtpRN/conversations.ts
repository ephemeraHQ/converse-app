import { ConsentListEntry, ConversationContext } from "@xmtp/react-native-sdk";

import { Conversation as DbConversation } from "../../data/db/entities/conversationEntity";
import { getPendingConversationsToCreate } from "../../data/helpers/conversations/pendingConversations";
import { saveConversations } from "../../data/helpers/conversations/upsertConversations";
import { getChatStore, getSettingsStore } from "../../data/store/accountsStore";
import { XmtpConversation } from "../../data/store/chatStore";
import { SettingsStoreType } from "../../data/store/settingsStore";
import { getCleanAddress } from "../eth";
import {
  getTopicDataFromKeychain,
  saveTopicDataToKeychain,
} from "../keychain/helpers";
import { haveSameItems } from "../objects";
import { sentryTrackError } from "../sentry";
import {
  ConversationWithCodecsType,
  ConverseXmtpClientType,
  GroupWithCodecsType,
} from "./client";
import { syncConversationsMessages, syncGroupsMessages } from "./messages";
import { getXmtpClient } from "./sync";

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
  isGroup: false,
});

const protocolGroupToStateConversation = (
  group: GroupWithCodecsType
): XmtpConversation => ({
  topic: group.topic,
  groupMembers: group.peerAddresses,
  createdAt: group.createdAt,
  messages: new Map(),
  messagesIds: [],
  conversationTitle: undefined,
  messageDraft: undefined,
  readUntil: 0,
  pending: false,
  version: group.version,
  isGroup: true,
  groupAdmins: [group.adminAddress],
  groupPermissionLevel: group.permissionLevel,
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
  [account: string]: {
    [topic: string]: ConversationWithCodecsType | GroupWithCodecsType;
  };
} = {};

const setOpenedConversation = (
  account: string,
  conversation: ConversationWithCodecsType | GroupWithCodecsType
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
  conversation: ConversationWithCodecsType | GroupWithCodecsType
) => {
  setOpenedConversation(client.address, conversation);
  const isGroup = !!(conversation as any).peerAddresses;
  const isDMConversation = !!(conversation as any).peerAddress;

  saveConversations(
    client.address,
    [
      isDMConversation
        ? protocolConversationToStateConversation(
            conversation as ConversationWithCodecsType
          )
        : protocolGroupToStateConversation(conversation as GroupWithCodecsType),
    ],
    true
  );

  if (isDMConversation) {
    saveTopicDataToKeychain(
      client.address,
      await protocolConversationsToTopicData([
        conversation as ConversationWithCodecsType,
      ])
    );
    // New conversations are not streamed immediatly
    // by the streamAllMessages method so we add this
    // trick to try and be all synced
    syncConversationsMessages(client.address, { [conversation.topic]: 0 });
    setTimeout(() => {
      syncConversationsMessages(client.address, { [conversation.topic]: 0 });
    }, 3000);
  } else if (isGroup) {
    syncGroupsMessages(client.address, [conversation as GroupWithCodecsType], {
      [conversation.topic]: 0,
    });
    setTimeout(() => {
      syncGroupsMessages(
        client.address,
        [conversation as GroupWithCodecsType],
        {
          [conversation.topic]: 0,
        }
      );
    }, 3000);
  }

  updateConsentStatus(client.address);
};

export const streamConversations = async (account: string) => {
  await stopStreamingConversations(account);
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  await client.conversations.stream(async (conversation) => {
    console.log("GOT A NEW DM CONVO");
    handleNewConversation(client, conversation);
  });
  console.log("STREAMING CONVOS");
};

// @todo => fix conversations.streamAll to stream convos AND groups
// but until them we stream them separately

const streamGroupsCancelMethods: { [account: string]: () => void } = {};

export const streamGroups = async (account: string) => {
  await stopStreamingGroups(account);
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;

  const cancelStreamGroupsForAccount = await client.conversations.streamGroups(
    async (group) => {
      console.log("GOT A NEW GROUP CONVO");
      handleNewConversation(client, group);
      // Let's reset stream if new group
      // @todo => it should be part of the SDK
      // streamAllGroupMessages(account);
    }
  );
  console.log("STREAMING GROUPS");
  streamGroupsCancelMethods[account] = cancelStreamGroupsForAccount;
};

export const stopStreamingConversations = async (account: string) => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  return client.conversations.cancelStream();
};

export const stopStreamingGroups = async (account: string) => {
  if (streamGroupsCancelMethods[account]) {
    streamGroupsCancelMethods[account]();
    delete streamGroupsCancelMethods[account];
  }
};

const listConversations = async (client: ConverseXmtpClientType) => {
  const conversations = await client.conversations.list();
  conversations.forEach((c) => {
    setOpenedConversation(client.address, c);
  });

  return conversations;
};

const listGroups = async (client: ConverseXmtpClientType) => {
  await client.conversations.syncGroups();
  const groups = await client.conversations.listGroups();
  groups.forEach((g) => {
    setOpenedConversation(client.address, g);
  });

  return groups;
};

export const loadConversations = async (
  account: string,
  knownTopics: string[]
) => {
  try {
    const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
    const now = new Date().getTime();
    const [conversations, groups] = await Promise.all([
      listConversations(client),
      listGroups(client),
    ]);
    const newConversations: ConversationWithCodecsType[] = [];
    const knownConversations: ConversationWithCodecsType[] = [];
    conversations.forEach((c) => {
      if (!knownTopics.includes(c.topic)) {
        newConversations.push(c);
      } else {
        knownConversations.push(c);
      }
    });

    const newGroups: GroupWithCodecsType[] = [];
    const updatedGroups: GroupWithCodecsType[] = [];
    const knownGroups: GroupWithCodecsType[] = [];

    groups.forEach((g) => {
      if (!knownTopics.includes(g.topic)) {
        newGroups.push(g);
      } else if (
        // @todo => maybe check the groupMembers for known topics before and pass it to this method
        // in the future => maybe also check the admins, the name, etc (anything that changes)
        !haveSameItems(
          g.peerAddresses,
          getChatStore(account).getState().conversations[g.topic]
            ?.groupMembers || []
        )
      ) {
        updatedGroups.push(g);
        knownGroups.push(g);
      } else {
        knownGroups.push(g);
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
    const groupsToSave = newGroups.map(protocolGroupToStateConversation);
    const groupsToUpdate = updatedGroups.map(protocolGroupToStateConversation);
    saveConversations(client.address, [
      ...conversationsToSave,
      ...groupsToSave,
    ]);
    saveConversations(client.address, groupsToUpdate, true); // Force update

    saveTopicDataToKeychain(
      client.address,
      await protocolConversationsToTopicData(newConversations)
    );
    return {
      newConversations,
      knownConversations,
      newGroups,
      knownGroups,
      groups,
    };
  } catch (e) {
    const error = new Error();
    error.name = "LOAD_CONVERSATIONS_FAILED";
    error.message = `${e}`;
    throw error;
  }
};

export const updateConsentStatus = async (account: string) => {
  try {
    const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
    const consentList = await client.contacts.refreshConsentList();
    await saveConsentState(consentList, client.address);
  } catch (error) {
    console.error("Failed to update consent status:", error);
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
    const client = (await getXmtpClient(account)) as ConverseXmtpClientType;

    if (consent === "allow") {
      await client.contacts.allow(cleanPeers);
    } else if (consent === "deny") {
      await client.contacts.deny(cleanPeers);
    } else {
      throw new Error(`Invalid consent type: ${consent}`);
    }
  } catch (error) {
    console.error("Error updating consent:", error);
  }
};

export const getConversationWithTopic = async (
  account: string,
  topic: string
): Promise<ConversationWithCodecsType | GroupWithCodecsType | undefined> => {
  const alreadyConversation = openedConversations[account]?.[topic];
  if (alreadyConversation) return alreadyConversation;
  // Let's try to import from keychain if we don't have it already
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
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
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  let context: ConversationContext | undefined = undefined;
  if (dbConversation.contextConversationId) {
    context = {
      conversationID: dbConversation.contextConversationId,
      metadata: dbConversation.contextMetadata
        ? JSON.parse(dbConversation.contextMetadata)
        : {},
    };
  }
  if (!dbConversation.isGroup && dbConversation.peerAddress) {
    const newConversation = await client.conversations.newConversation(
      dbConversation.peerAddress,
      context
    );
    handleNewConversation(client, newConversation);
    return newConversation.topic;
  } else if (dbConversation.isGroup && dbConversation.groupMembers) {
    const newGroup = await client.conversations.newGroup(
      dbConversation.groupMembers
    );
    handleNewConversation(client, newGroup);
  }
};

export const createPendingConversations = async (account: string) => {
  const pendingConvos = await getPendingConversationsToCreate(account);
  if (pendingConvos.length === 0) return;
  console.log(
    `Trying to create ${pendingConvos.length} pending conversations...`
  );
  await Promise.all(pendingConvos.map((c) => createConversation(account, c)));
};

export const canGroupMessage = async (account: string, peer: string) => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  return client.canGroupMessage([peer]);
};

export const createGroup = async (
  account: string,
  peers: string[],
  permissionLevel: "everyone_admin" | "creator_admin"
) => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  const group = await client.conversations.newGroup(peers, permissionLevel);
  await handleNewConversation(client, group);
  return group.topic;
};

const refreshGroup = async (account: string, topic: string) => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  await client.conversations.syncGroups();
  const groups = await client.conversations.listGroups();
  const group = groups.find((g) => g.topic === topic);
  if (!group) throw new Error(`Group ${topic} not found, cannot refresh`);
  saveConversations(
    client.address,
    [protocolGroupToStateConversation(group)],
    true
  );
};

export const removeMembersFromGroup = async (
  account: string,
  topic: string,
  members: string[]
) => {
  const group = await getConversationWithTopic(account, topic);
  if (!group || (group as any).peerAddress) {
    throw new Error(
      `Conversation with topic ${topic} does not exist or is not a group`
    );
  }
  await (group as GroupWithCodecsType).removeMembers(members);
  refreshGroup(account, topic);
};

export const addMembersToGroup = async (
  account: string,
  topic: string,
  members: string[]
) => {
  const group = await getConversationWithTopic(account, topic);
  if (!group || (group as any).peerAddress) {
    throw new Error(
      `Conversation with topic ${topic} does not exist or is not a group`
    );
  }
  await (group as GroupWithCodecsType).addMembers(members);
  refreshGroup(account, topic);
};
