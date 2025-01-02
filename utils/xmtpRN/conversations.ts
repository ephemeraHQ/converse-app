import { addConversationToConversationListQuery } from "@/queries/useConversationListQuery";
import { getV3IdFromTopic } from "@utils/groupUtils/groupId";
import logger from "@utils/logger";
import {
  ConversationOptions,
  ConversationOrder,
  ConversationTopic,
} from "@xmtp/react-native-sdk";
import { PermissionPolicySet } from "@xmtp/react-native-sdk/build/lib/types/PermissionPolicySet";
import {
  ConversationWithCodecsType,
  ConverseXmtpClientType,
  DmWithCodecsType,
} from "./client.types";
import { streamAllMessages } from "./messages";
import { getXmtpClient } from "./sync";

export const streamConversations = async (account: string) => {
  await stopStreamingConversations(account);
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  await client.conversations.stream(async (conversation) => {
    logger.info("[XMTPRN Conversations] GOT A NEW CONVO");
    addConversationToConversationListQuery({ account, conversation });
  });
  logger.info("STREAMING CONVOS");
};

export const stopStreamingConversations = async (account: string) => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  return client.conversations.cancelStream();
};

export const listConversations = async (args: {
  client: ConverseXmtpClientType;
  includeSync?: boolean;
  order?: ConversationOrder;
  limit?: number;
  opts?: ConversationOptions;
}) => {
  const { client, includeSync = false, order, limit, opts } = args;
  logger.debug("[XMTPRN Conversations] Listing conversations");
  const start = new Date().getTime();
  if (includeSync) {
    logger.debug("[XMTPRN Conversations] Syncing conversations");
    const syncStart = new Date().getTime();
    await client.conversations.sync();
    const syncEnd = new Date().getTime();
    logger.debug(
      `[XMTPRN Conversations] Synced conversations in ${
        (syncEnd - syncStart) / 1000
      } sec`
    );
  }
  const conversations = await client.conversations.list(opts, order, limit);
  const end = new Date().getTime();
  logger.debug(
    `[XMTPRN Conversations] Listed conversations in ${(end - start) / 1000} sec`
  );
  return conversations;
};

export const listConversationsByAccount = async (args: {
  account: string;
  includeSync?: boolean;
  order?: ConversationOrder;
  limit?: number;
  opts?: ConversationOptions;
}) => {
  const { account, includeSync = false, order, limit, opts } = args;
  logger.debug("[XMTPRN Conversations] Listing conversations by account");
  const start = new Date().getTime();
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  if (!client) {
    throw new Error("Client not found");
  }
  const conversations = await listConversations({
    client,
    includeSync,
    order,
    limit,
    opts,
  });
  const end = new Date().getTime();
  logger.debug(
    `[XMTPRN Conversations] Listed conversations in ${(end - start) / 1000} sec`
  );
  return conversations;
};

async function findGroup(args: {
  client: ConverseXmtpClientType;
  topic: ConversationTopic;
  includeSync?: boolean;
}) {
  const { client, topic, includeSync = false } = args;
  logger.debug(`[XMTPRN Conversations] Getting group by ${topic}`);
  const start = new Date().getTime();

  const lookupStart = new Date().getTime();
  let group = await client.conversations.findGroup(getV3IdFromTopic(topic));
  const lookupEnd = new Date().getTime();
  logger.debug(
    `[XMTPRN Conversations] Initial lookup took ${(lookupEnd - lookupStart) / 1000} sec`
  );

  if (!group) {
    logger.debug(
      `[XMTPRN Conversations] Group not found, syncing conversations`
    );
    const syncStart = new Date().getTime();
    await client.conversations.sync();
    const syncEnd = new Date().getTime();
    logger.debug(
      `[XMTPRN Conversations] Synced conversations in ${(syncEnd - syncStart) / 1000} sec`
    );

    group = await client.conversations.findGroup(getV3IdFromTopic(topic));
    if (!group) {
      throw new Error(`Group ${topic} not found`);
    }
  }

  if (includeSync) {
    const syncStart = new Date().getTime();
    await group.sync();
    const syncEnd = new Date().getTime();
    logger.debug(
      `[XMTPRN Conversations] Synced group in ${(syncEnd - syncStart) / 1000} sec`
    );
  }

  const end = new Date().getTime();
  logger.debug(
    `[XMTPRN Conversations] Total time to get group: ${(end - start) / 1000} sec`
  );

  return group;
}

async function findDm(args: {
  client: ConverseXmtpClientType;
  peer: string;
  includeSync?: boolean;
}) {
  const { client, peer, includeSync = false } = args;
  logger.debug(`[XMTPRN Conversations] Getting DM by ${peer}`);
  const start = new Date().getTime();

  const lookupStart = new Date().getTime();
  let dm = await client.conversations.findDmByAddress(peer);
  const lookupEnd = new Date().getTime();
  logger.debug(
    `[XMTPRN Conversations] Initial lookup took ${(lookupEnd - lookupStart) / 1000} sec`
  );

  if (!dm) {
    logger.debug(`[XMTPRN Conversations] DM not found, syncing conversations`);
    const syncStart = new Date().getTime();
    await client.conversations.sync();
    const syncEnd = new Date().getTime();
    logger.debug(
      `[XMTPRN Conversations] Synced conversations in ${(syncEnd - syncStart) / 1000} sec`
    );

    dm = await client.conversations.findDmByAddress(peer);
    if (!dm) {
      throw new Error(`DM with peer ${peer} not found`);
    }
  }

  if (includeSync) {
    const syncStart = new Date().getTime();
    await dm.sync();
    const syncEnd = new Date().getTime();
    logger.debug(
      `[XMTPRN Conversations] Synced DM in ${(syncEnd - syncStart) / 1000} sec`
    );
  }

  const end = new Date().getTime();
  logger.debug(
    `[XMTPRN Conversations] Total time to get DM: ${(end - start) / 1000} sec`
  );

  return dm;
}

async function findConversation(args: {
  client: ConverseXmtpClientType;
  topic: ConversationTopic;
  includeSync?: boolean;
}) {
  const { client, topic, includeSync = false } = args;
  logger.debug(`[XMTPRN Conversations] Getting conversation by ${topic}`);
  const start = new Date().getTime();

  const lookupStart = new Date().getTime();
  let conversation = await client.conversations.findConversationByTopic(topic);
  const lookupEnd = new Date().getTime();
  logger.debug(
    `[XMTPRN Conversations] Initial lookup took ${(lookupEnd - lookupStart) / 1000} sec`
  );

  if (!conversation) {
    logger.debug(
      `[XMTPRN Conversations] Conversation not found, syncing conversations`
    );
    const syncStart = new Date().getTime();
    await client.conversations.sync();
    const syncEnd = new Date().getTime();
    logger.debug(
      `[XMTPRN Conversations] Synced conversations in ${(syncEnd - syncStart) / 1000} sec`
    );

    conversation = await client.conversations.findConversationByTopic(topic);
    if (!conversation) {
      throw new Error(`Conversation ${topic} not found`);
    }
  }

  if (includeSync) {
    const syncStart = new Date().getTime();
    await conversation.sync();
    const syncEnd = new Date().getTime();
    logger.debug(
      `[XMTPRN Conversations] Synced conversation in ${(syncEnd - syncStart) / 1000} sec`
    );
  }

  const end = new Date().getTime();
  logger.debug(
    `[XMTPRN Conversations] Total time to get conversation: ${(end - start) / 1000} sec`
  );

  return conversation;
}

export const getGroupByTopic = async (args: {
  client: ConverseXmtpClientType;
  topic: ConversationTopic;
  includeSync?: boolean;
}) => {
  const { client, topic, includeSync = false } = args;
  return findGroup({
    client,
    topic,
    includeSync,
  });
};

export async function getGroupByTopicByAccount(args: {
  account: string;
  topic: ConversationTopic;
  includeSync?: boolean;
}) {
  const { account, topic, includeSync = false } = args;
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  return getGroupByTopic({
    client,
    topic,
    includeSync,
  });
}

export const getConversationByPeer = async (args: {
  client: ConverseXmtpClientType;
  peer: string;
  includeSync?: boolean;
}) => {
  const { client, peer, includeSync = false } = args;
  return findDm({
    client,
    peer,
    includeSync,
  });
};

export const getConversationByTopic = async (args: {
  client: ConverseXmtpClientType;
  topic: ConversationTopic;
  includeSync?: boolean;
}) => {
  const { client, topic, includeSync = false } = args;
  return findConversation({
    client,
    topic,
    includeSync,
  });
};

export const getConversationByTopicByAccount = async (args: {
  account: string;
  topic: ConversationTopic;
  includeSync?: boolean;
}) => {
  const { account, topic, includeSync = false } = args;
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  return getConversationByTopic({ client, topic, includeSync });
};

export const createConversation = async (args: {
  client: ConverseXmtpClientType;
  peerAddress: string;
}) => {
  const { client, peerAddress } = args;
  logger.info(`[XMTP] Creating a conversation with peer ${peerAddress}`);
  const conversation = await client.conversations.findOrCreateDm(peerAddress);
  await handleNewConversationCreation(client, conversation);
  return conversation;
};

export const createConversationByAccount = async (
  account: string,
  peerAddress: string
) => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  if (!client) {
    throw new Error("Client not found");
  }
  return createConversation({ client, peerAddress });
};

export const createGroup = async (args: {
  client: ConverseXmtpClientType;
  peers: string[];
  permissionPolicySet: PermissionPolicySet;
  groupName?: string;
  groupPhoto?: string;
  groupDescription?: string;
}) => {
  const {
    client,
    peers,
    permissionPolicySet,
    groupName,
    groupPhoto,
    groupDescription,
  } = args;
  const group = await client.conversations.newGroupCustomPermissions(
    peers,
    permissionPolicySet,
    {
      name: groupName,
      imageUrlSquare: groupPhoto,
      description: groupDescription,
    }
  );

  logger.info("[XMTPRN Conversations] Created group");

  await handleNewConversationCreation(client, group);

  return group;
};

export const createGroupByAccount = async (args: {
  peers: string[];
  permissionPolicySet: PermissionPolicySet;
  groupName?: string;
  groupPhoto?: string;
  groupDescription?: string;
}) => {
  const {
    peers,
    permissionPolicySet,
    groupName,
    groupPhoto,
    groupDescription,
  } = args;
  const account = getCurrentAccount();
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  return createGroup({
    client,
    peers,
    permissionPolicySet,
    groupName,
    groupPhoto,
    groupDescription,
  });
};

export const refreshProtocolConversation = async (args: {
  client: ConverseXmtpClientType;
  topic: ConversationTopic;
}) => {
  const { client, topic } = args;
  return getConversationByTopic({ client, topic, includeSync: true });
};

export const refreshProtocolConversationByAccount = async (args: {
  account: string;
  topic: ConversationTopic;
}) => {
  const { account, topic } = args;
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  return refreshProtocolConversation({ client, topic });
};

export const getConversationByPeerByAccount = async (args: {
  account: string;
  peer: string;
  includeSync?: boolean;
}) => {
  const { account, peer, includeSync = false } = args;
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  return getConversationByPeer({ client, peer, includeSync });
};

export const getPeerAddressDm = async (
  dm: DmWithCodecsType
): Promise<string | undefined> => {
  const peerInboxId = await dm.peerInboxId();
  const peerAddress = (await dm.members()).find(
    (member) => member.inboxId === peerInboxId
  )?.addresses[0];
  return peerAddress;
};

// TODO: This is a temporary function to handle new conversation creation
// This is a temporary workaround related to https://github.com/xmtp/xmtp-react-native/issues/560
const handleNewConversationCreation = async (
  client: ConverseXmtpClientType,
  _conversation: ConversationWithCodecsType
) => {
  logger.info(
    "[XMTPRN Conversations] Restarting message stream to handle new conversation"
  );
  await streamAllMessages(client.address);
};
