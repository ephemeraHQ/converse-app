import { entifyWithAddress } from "@queries/entify";
import { setGroupDescriptionQueryData } from "@queries/useGroupDescriptionQuery";
import { setGroupMembersQueryData } from "@queries/useGroupMembersQuery";
import { setGroupQueryData } from "@queries/useGroupQuery";
import { converseEventEmitter } from "@utils/events";
import { getGroupIdFromTopic, isGroupTopic } from "@utils/groupUtils/groupId";
import logger from "@utils/logger";
import { areSetsEqual } from "@utils/set";
import {
  ConsentListEntry,
  ConversationContext,
  ConversationVersion,
  Group,
  InboxId,
} from "@xmtp/react-native-sdk";
import { PermissionPolicySet } from "@xmtp/react-native-sdk/build/lib/types/PermissionPolicySet";

import {
  ConversationWithCodecsType,
  ConverseXmtpClientType,
  GroupWithCodecsType,
} from "./client";
import { syncConversationsMessages, syncGroupsMessages } from "./messages";
import { getXmtpClient } from "./sync";
import { Conversation as DbConversation } from "../../data/db/entities/conversationEntity";
import { getPendingConversationsToCreate } from "../../data/helpers/conversations/pendingConversations";
import { saveConversations } from "../../data/helpers/conversations/upsertConversations";
import { saveMemberInboxIds } from "../../data/helpers/inboxId/saveInboxIds";
import { getChatStore, getSettingsStore } from "../../data/store/accountsStore";
import {
  XmtpConversation,
  XmtpGroupConversation,
} from "../../data/store/chatStore";
import { SettingsStoreType } from "../../data/store/settingsStore";
import { setGroupNameQueryData } from "../../queries/useGroupNameQuery";
import { setGroupPhotoQueryData } from "../../queries/useGroupPhotoQuery";
import {
  addGroupToGroupsQuery,
  fetchGroupsQuery,
} from "../../queries/useGroupsQuery";
import { ConversationWithLastMessagePreview } from "../conversation";
import { getCleanAddress } from "../eth";
import { getTopicDataFromKeychain } from "../keychain/helpers";
import { getSecureMmkvForAccount } from "../mmkv";
import { sentryTrackError } from "../sentry";

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
  messageDraft: undefined,
  mediaPreview: undefined,
  readUntil: 0,
  pending: false,
  version: conversation.version,
  isGroup: false,
});

const protocolGroupToStateConversation = (
  account: string,
  group: GroupWithCodecsType
): XmtpConversation => {
  // We'll pre-cache some queries since we know
  // this data is up to date - was just queried!
  setGroupQueryData(account, group.topic, group as Group);
  setGroupNameQueryData(account, group.topic, group.name);
  setGroupPhotoQueryData(account, group.topic, group.imageUrlSquare);
  setGroupMembersQueryData(
    account,
    group.topic,
    entifyWithAddress(
      group.members,
      (member) => member.inboxId,
      // TODO: Multiple addresses support
      (member) => getCleanAddress(member.addresses[0])
    )
  );
  const groupMembersAddresses: string[] = [];
  const groupAddedByInboxId = group.addedByInboxId;
  let groupCreator: string | undefined;
  let groupAddedBy: string | undefined;

  group.members.forEach((m) => {
    const firstAddress = getCleanAddress(m.addresses[0]);
    if (firstAddress) {
      groupMembersAddresses.push(firstAddress);
      if (m.inboxId === group.creatorInboxId) {
        groupCreator = firstAddress;
      }
      if (m.inboxId === groupAddedByInboxId) {
        groupAddedBy = firstAddress;
      }
    }
  });
  return {
    topic: group.topic,
    groupMembers: groupMembersAddresses,
    createdAt: group.createdAt,
    messages: new Map(),
    messagesIds: [],
    messageDraft: undefined,
    mediaPreview: undefined,
    readUntil: 0,
    pending: false,
    version: group.version,
    isGroup: true,
    groupPermissionLevel: "custom_policy",
    groupName: group.name,
    groupCreator,
    groupAddedBy,
    isActive: group.isGroupActive,
  };
};

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

// @todo => to remove once enough device use the "backupTopicsData"
// that puts everything in mmkv using an encryption key
const importSingleTopicData = async (
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
      logger.debug(
        `[XmtpRN] Imported ${
          topicsData.length
        } exported conversations into client in ${
          (afterImport - beforeImport) / 1000
        }s`
      );
    } catch (e) {
      // It's ok if import failed it will just be slower
      logger.error(e);
    }
  }
};

const handleNewConversation = async (
  client: ConverseXmtpClientType,
  conversation: ConversationWithCodecsType | GroupWithCodecsType
) => {
  setOpenedConversation(client.address, conversation);
  const isGroup = conversation.version === ConversationVersion.GROUP;
  const isDMConversation = !!(conversation as any).peerAddress;

  // Temporary fix to stop receiving messages for groups
  // we are not member of
  const shouldSkip =
    isGroup &&
    !(conversation as GroupWithCodecsType).members.some(
      (m) => m.addresses[0].toLowerCase() === client.address.toLowerCase()
    );
  if (shouldSkip) {
    logger.warn(
      `Skipping group; ${client.address} is not a member of ${
        (conversation as GroupWithCodecsType).id
      }`
    );
    return;
  }
  saveConversations(
    client.address,
    [
      isDMConversation
        ? protocolConversationToStateConversation(
            conversation as ConversationWithCodecsType
          )
        : protocolGroupToStateConversation(
            client.address,
            conversation as GroupWithCodecsType
          ),
    ],
    true
  );

  if (isDMConversation) {
    backupTopicsData(
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
    const group = conversation as GroupWithCodecsType;
    await group.sync();
    addGroupToGroupsQuery(client.address, group);
    syncGroupsMessages(client.address, [group], {
      [conversation.topic]: 0,
    });
    setTimeout(() => {
      syncGroupsMessages(client.address, [group], {
        [conversation.topic]: 0,
      });
    }, 3000);
  }

  updateConsentStatus(client.address);
};

export const streamConversations = async (account: string) => {
  await stopStreamingConversations(account);
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  await client.conversations.stream(async (conversation) => {
    logger.info("GOT A NEW DM CONVO");
    handleNewConversation(client, conversation);
  });
  logger.info("STREAMING CONVOS");
};

// @todo => fix conversations.streamAll to stream convos AND groups
// but until them we stream them separately

const streamGroupsCancelMethods: { [account: string]: () => void } = {};

export const streamGroups = async (account: string) => {
  await stopStreamingGroups(account);
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;

  const cancelStreamGroupsForAccount = await client.conversations.streamGroups(
    async (group) => {
      logger.info("GOT A NEW GROUP CONVO");
      handleNewConversation(client, group);
      converseEventEmitter.emit("newGroup", group);
      // Let's reset stream if new group
      // @todo => it should be part of the SDK
      // streamAllGroupMessages(account);
    }
  );
  logger.info("STREAMING GROUPS");
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
  const beforeList = new Date().getTime();
  const conversations = await client.conversations.list();
  conversations.forEach((c) => {
    setOpenedConversation(client.address, c);
  });
  const afterList = new Date().getTime();
  logger.debug(
    `[XmtpRN] Listing ${
      conversations.length
    } 1:1 conversations from network took ${
      (afterList - beforeList) / 1000
    } sec`
  );

  return conversations;
};

const listGroups = async (client: ConverseXmtpClientType) => {
  // @todo => this will be adapted once we have a syncAllGroups method
  const beforeSyncGroups = await fetchGroupsQuery(client.address);
  beforeSyncGroups.ids.forEach((id) => {
    setOpenedConversation(client.address, beforeSyncGroups.byId[id]);
  });
  // Resync process
  const beforeSyncAll = new Date().getTime();
  await client.conversations.syncAllGroups();
  const afterSyncAll = new Date().getTime();
  logger.debug(
    `[Groups] Syncing all groups from network took ${
      (afterSyncAll - beforeSyncAll) / 1000
    } sec`
  );
  // Now that it's synced, let's refresh
  const updatedGroups = await fetchGroupsQuery(client.address, 0);
  return updatedGroups.ids.map((id) => {
    setOpenedConversation(client.address, updatedGroups.byId[id]);
    return updatedGroups.byId[id];
  });
};

export const importedTopicsDataForAccount: { [account: string]: boolean } = {};

export const loadConversations = async (
  account: string,
  knownTopics: string[]
) => {
  try {
    const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
    if (!importedTopicsDataForAccount[account]) {
      importedTopicsDataForAccount[account] = true;
      await importBackedTopicsData(client);
    }
    const [conversations, groups] = await Promise.all([
      listConversations(client),
      listGroups(client),
    ]);

    const beforeCompareGroups = new Date().getTime();

    const knownTopicsSet = new Set(knownTopics);
    const newConversations: ConversationWithCodecsType[] = [];
    const knownConversations: ConversationWithCodecsType[] = [];

    conversations.forEach((c) => {
      if (knownTopicsSet.has(c.topic)) {
        knownConversations.push(c);
      } else {
        newConversations.push(c);
      }
    });

    const newGroups: GroupWithCodecsType[] = [];
    const knownGroups: GroupWithCodecsType[] = [];
    const updatedGroups: GroupWithCodecsType[] = [];

    groups.forEach((g) => {
      if (!knownTopicsSet.has(g.topic)) {
        newGroups.push(g);
      } else {
        knownGroups.push(g);
        const existingGroup = getChatStore(account).getState().conversations[
          g.topic
        ] as XmtpGroupConversation;

        if (!existingGroup) {
          updatedGroups.push(g);
        } else {
          const currentMembersSet = new Set(existingGroup.groupMembers);
          const newMembersSet = new Set(
            g.members.map((m) => getCleanAddress(m.addresses[0]))
          );

          if (
            existingGroup.groupName !== g.name ||
            existingGroup.isActive !== g.isGroupActive ||
            !areSetsEqual(currentMembersSet, newMembersSet)
          ) {
            updatedGroups.push(g);
          }
        }
      }
    });

    const afterCompareGroups = new Date().getTime();

    logger.debug(
      `[XmtpRN] Handled new & updated groups for ${client.address} in ${
        (afterCompareGroups - beforeCompareGroups) / 1000
      } sec`
    );

    const conversationsToSave = newConversations.map(
      protocolConversationToStateConversation
    );
    const groupsToCreate = newGroups.map((g) =>
      protocolGroupToStateConversation(account, g)
    );
    const groupsToUpdate = updatedGroups.map((g) =>
      protocolGroupToStateConversation(account, g)
    );

    const afterMappedConvos = new Date().getTime();

    logger.debug(
      `[XmtpRN] Mapped groups & conversations for ${client.address} in ${
        (afterMappedConvos - afterCompareGroups) / 1000
      } sec`
    );

    saveConversations(client.address, [
      ...conversationsToSave,
      ...groupsToCreate,
    ]);
    saveConversations(client.address, groupsToUpdate, true); // Force update

    backupTopicsData(
      client.address,
      await protocolConversationsToTopicData(conversations)
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
    const beforeFetch = new Date().getTime();
    const consentList = await client.contacts.refreshConsentList();
    const afterFetch = new Date().getTime();
    logger.debug(
      `[Consent] Fetched consent state in ${
        (afterFetch - beforeFetch) / 1000
      } sec`
    );
    await saveConsentState(consentList, client.address);
    const afterSave = new Date().getTime();
    logger.debug(
      `[Consent] SAved consent state in ${(afterSave - afterFetch) / 1000} sec`
    );
  } catch (error) {
    logger.error(error, { context: "Failed to update consent status:" });
  }
};

const saveConsentState = async (
  consentList: ConsentListEntry[],
  account: string
) => {
  const peersStatus: SettingsStoreType["peersStatus"] = {};
  const groupStatus: SettingsStoreType["groupStatus"] = {};
  const inboxIdPeerStatus: SettingsStoreType["inboxIdPeerStatus"] = {};

  consentList.forEach((entry) => {
    if (entry.entryType === "address") {
      if (entry.permissionType === "allowed") {
        peersStatus[entry.value] = "consented";
      } else if (entry.permissionType === "denied") {
        peersStatus[entry.value] = "blocked";
      }
    } else if (entry.entryType === "group_id") {
      if (entry.permissionType === "allowed") {
        groupStatus[entry.value] = "allowed";
      } else if (entry.permissionType === "denied") {
        groupStatus[entry.value] = "denied";
      }
    } else if (entry.entryType === "inbox_id") {
      if (entry.permissionType === "allowed") {
        inboxIdPeerStatus[entry.value as InboxId] = "allowed";
      } else if (entry.permissionType === "denied") {
        inboxIdPeerStatus[entry.value as InboxId] = "denied";
      }
    }
  });
  if (Object.keys(peersStatus).length > 0) {
    getSettingsStore(account).getState().setPeersStatus(peersStatus);
  }
  if (Object.keys(groupStatus).length > 0) {
    getSettingsStore(account).getState().setGroupStatus(groupStatus);
  }
  if (Object.keys(inboxIdPeerStatus).length > 0) {
    getSettingsStore(account)
      .getState()
      .setInboxIdPeerStatus(inboxIdPeerStatus);
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
    logger.error(error, { context: "Error updating consent" });
  }
};

export const consentToGroupsOnProtocol = async (
  account: string,
  groupIds: string[],
  consent: "allow" | "deny"
) => {
  try {
    const client = (await getXmtpClient(account)) as ConverseXmtpClientType;

    if (consent === "allow") {
      await client.contacts.allowGroups(groupIds);
    } else if (consent === "deny") {
      await client.contacts.denyGroups(groupIds);
    } else {
      throw new Error(`Invalid consent type: ${consent}`);
    }
  } catch (error) {
    logger.error(error, { context: "Error updating consent" });
  }
};

export const consentToInboxIdsOnProtocol = async (
  account: string,
  inboxIds: InboxId[],
  consent: "allow" | "deny"
) => {
  try {
    const client = (await getXmtpClient(account)) as ConverseXmtpClientType;

    if (consent === "allow") {
      await client.contacts.allowInboxes(inboxIds);
    } else if (consent === "deny") {
      await client.contacts.denyInboxes(inboxIds);
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
): Promise<ConversationWithCodecsType | GroupWithCodecsType | undefined> => {
  const alreadyConversation = openedConversations[account]?.[topic];
  if (alreadyConversation) return alreadyConversation;
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  if (isGroupTopic(topic)) {
    const group = await client.conversations.findGroup(
      getGroupIdFromTopic(topic)
    );
    if (group) {
      setOpenedConversation(client.address, group);
    }
    return group;
  } else {
    // Let's try to import from keychain if we don't have it already
    await importSingleTopicData(client, [topic]);
    return openedConversations[account]?.[topic];
  }
};

const createConversation = async (
  account: string,
  dbConversation: DbConversation
) => {
  if (!dbConversation.pending) {
    throw new Error("Can only create a conversation that is pending");
  }
  logger.info(
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
  logger.info(
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
  permissionPolicySet: PermissionPolicySet,
  groupName?: string,
  groupPhoto?: string,
  groupDescription?: string
) => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  const group = await client.conversations.newGroupCustomPermissions(
    peers,
    permissionPolicySet,
    {
      name: groupName,
      imageUrlSquare: groupPhoto,
      description: groupDescription,
    }
  );
  if (groupName) {
    setGroupNameQueryData(account, group.topic, groupName);
  }
  if (groupPhoto) {
    setGroupPhotoQueryData(account, group.topic, groupPhoto);
  }
  if (groupDescription) {
    setGroupDescriptionQueryData(account, group.topic, groupDescription);
  }
  saveMemberInboxIds(account, group.members);
  await handleNewConversation(client, group);
  return group.topic;
};

export const refreshGroup = async (account: string, topic: string) => {
  logger.debug(`[refreshGroup] Refreshing group ${topic}`);
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  await client.conversations.syncGroups();
  const group = await client.conversations.findGroup(
    getGroupIdFromTopic(topic)
  );
  if (!group) throw new Error(`Group ${topic} not found, cannot refresh`);

  await group.sync();
  logger.debug(`[refreshGroup] Group ${topic} synced`);
  saveConversations(
    client.address,
    [protocolGroupToStateConversation(account, group)],
    true
  );
  logger.debug(`[refreshGroup] Conversations saved`);
  const updatedMembers = await group.membersList();
  saveMemberInboxIds(account, updatedMembers);
};

export const loadConversationsHmacKeys = async (account: string) => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  const before = new Date().getTime();
  const { hmacKeys } = await client.conversations.getHmacKeys();
  const after = new Date().getTime();
  logger.debug(
    `[XmtpRn] Fetched ${Object.keys(hmacKeys).length} hmac keys in ${
      (after - before) / 1000
    } sec`
  );
  return hmacKeys;
};

type TopicDataByTopic = { [topic: string]: string };

const backupTopicsData = async (
  account: string,
  conversationTopicData: TopicDataByTopic
) => {
  try {
    const beforeBackup = new Date().getTime();
    const alreadyTopicsData = await retrieveTopicsData(account);
    const newTopicsData = { ...alreadyTopicsData, ...conversationTopicData };
    const stringData = JSON.stringify(newTopicsData);
    const mmkvInstance = await getSecureMmkvForAccount(account);
    mmkvInstance.set("XMTP_TOPICS_DATA", stringData);
    const afterBackup = new Date().getTime();
    logger.debug(
      `[XmtpRN] Backed up ${
        Object.keys(newTopicsData).length
      } conversations into secure mmkv in ${
        (afterBackup - beforeBackup) / 1000
      }s`
    );
  } catch (e) {
    sentryTrackError(e, { error: "Could not backup topics data" });
  }
};

const retrieveTopicsData = async (
  account: string
): Promise<TopicDataByTopic> => {
  const mmkvInstance = await getSecureMmkvForAccount(account);
  const decryptedData = mmkvInstance.getString("XMTP_TOPICS_DATA");
  if (decryptedData) {
    try {
      const conversationTopicData: TopicDataByTopic = JSON.parse(decryptedData);
      return conversationTopicData;
    } catch {
      return {};
    }
  } else {
    return {};
  }
};

const importBackedTopicsData = async (client: ConverseXmtpClientType) => {
  try {
    const beforeRetrieve = new Date().getTime();
    const topicsData = Object.values(await retrieveTopicsData(client.address));
    const beforeImport = new Date().getTime();
    logger.debug(
      `[XmtpRN] Retrieved ${topicsData.length} topic data from mmkv in ${
        (beforeImport - beforeRetrieve) / 1000
      } sec`
    );
    // If we have topics for this account, let's import them
    // so the first conversation.list() is faster
    if (topicsData.length > 0) {
      const importedConversations = await Promise.all(
        topicsData.map((data) => client.conversations.importTopicData(data))
      );

      importedConversations.forEach((conversation) => {
        setOpenedConversation(client.address, conversation);
      });

      const afterImport = new Date().getTime();
      logger.debug(
        `[XmtpRN] Imported ${
          topicsData.length
        } exported conversations into client in ${
          (afterImport - beforeImport) / 1000
        }s`
      );
    }
  } catch (e) {
    sentryTrackError(e, { error: "Could not import backed up topics data" });
  }
};

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
      conversation.spamScore !== null &&
      conversation.spamScore < 1 &&
      conversation.version !== ConversationVersion.GROUP;
    // @todo => remove this once we have group-specific spam scores

    if (isLikelyNotSpam) {
      result.likelyNotSpam.push(conversation);
    } else {
      result.likelySpam.push(conversation);
    }
  });

  return result;
};
