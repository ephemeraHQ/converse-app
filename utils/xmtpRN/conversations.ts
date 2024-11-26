import logger from "@utils/logger";
import {
  ConversationOrder,
  ConversationOptions,
  ConversationTopic,
  ConversationVersion,
} from "@xmtp/react-native-sdk";
import { PermissionPolicySet } from "@xmtp/react-native-sdk/build/lib/types/PermissionPolicySet";

import {
  ConversationWithCodecsType,
  ConverseXmtpClientType,
  DmWithCodecsType,
} from "./client";
import { getXmtpClient } from "./sync";
import { getV3IdFromTopic } from "@utils/groupUtils/groupId";

export const streamConversations = async (account: string) => {
  await stopStreamingConversations(account);
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  await client.conversations.stream(async (conversation) => {
    logger.info("[XMTPRN Conversations] GOT A NEW CONVO");
    // handleNewConversation(client, conversation);
  });
  logger.info("STREAMING CONVOS");
};

export const stopStreamingConversations = async (account: string) => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  return client.conversations.cancelStream();
};

type ListConversationsParams = {
  client: ConverseXmtpClientType;
  includeSync?: boolean;
  order?: ConversationOrder;
  limit?: number;
  opts?: ConversationOptions;
};

export const listConversations = async ({
  client,
  includeSync = false,
  order,
  limit,
  opts,
}: ListConversationsParams) => {
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

type ListConversationsByAccountParams = {
  account: string;
  includeSync?: boolean;
  order?: ConversationOrder;
  limit?: number;
  opts?: ConversationOptions;
};

export const listConversationsByAccount = async ({
  account,
  includeSync = false,
  order,
  limit,
  opts,
}: ListConversationsByAccountParams) => {
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

type GetConversationByTopicByAccountParams = {
  account: string;
  topic: ConversationTopic;
  includeSync?: boolean;
};

export const getConversationByTopicByAccount = async ({
  account,
  topic,
  includeSync = false,
}: GetConversationByTopicByAccountParams): Promise<ConversationWithCodecsType> => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  if (!client) {
    throw new Error("Client not found");
  }
  return getConversationByTopic({ client, topic, includeSync });
};

type GetConversationByTopicParams = {
  client: ConverseXmtpClientType;
  topic: ConversationTopic;
  includeSync?: boolean;
};

export const getConversationByTopic = async ({
  client,
  topic,
  includeSync = false,
}: GetConversationByTopicParams): Promise<ConversationWithCodecsType> => {
  logger.debug(
    `[XMTPRN Conversations] Getting conversation by topic: ${topic}`
  );
  const start = new Date().getTime();
  let conversation = await client.conversations.findConversationByTopic(topic);
  if (!conversation) {
    logger.debug(
      `[XMTPRN Conversations] Conversation ${topic} not found, syncing conversations`
    );
    const syncStart = new Date().getTime();
    await client.conversations.sync();
    const syncEnd = new Date().getTime();
    logger.debug(
      `[XMTPRN Conversations] Synced conversations in ${
        (syncEnd - syncStart) / 1000
      } sec`
    );
    conversation = await client.conversations.findConversationByTopic(topic);
  }
  if (!conversation) {
    throw new Error(`Conversation ${topic} not found`);
  }
  if (includeSync) {
    const syncStart = new Date().getTime();
    await conversation.sync();
    const syncEnd = new Date().getTime();
    logger.debug(
      `[XMTPRN Conversations] Synced conversation in ${
        (syncEnd - syncStart) / 1000
      } sec`
    );
  }
  const end = new Date().getTime();
  logger.debug(
    `[XMTPRN Conversations] Got conversation by topic in ${
      (end - start) / 1000
    } sec`
  );
  return conversation;
};

type GetDmByAddressParams = {
  client: ConverseXmtpClientType;
  address: string;
  includeSync?: boolean;
};

export const getDmByAddress = async ({
  client,
  address,
  includeSync = false,
}: GetDmByAddressParams) => {
  logger.debug(`[XMTPRN Conversations] Getting Dm by address: ${address}`);
  const start = new Date().getTime();
  let dm = await client.conversations.findDmByAddress(address);
  if (!dm) {
    logger.debug(
      `[XMTPRN Conversations] Dm ${address} not found, syncing conversations`
    );
    const syncStart = new Date().getTime();
    await client.conversations.sync();
    const syncEnd = new Date().getTime();
    logger.debug(
      `[XMTPRN Conversations] Synced conversations in ${
        (syncEnd - syncStart) / 1000
      } sec`
    );
    dm = await client.conversations.findDmByAddress(address);
  }
  if (!dm) {
    throw new Error(`Dm ${address} not found`);
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
    `[XMTPRN Conversations] Got dm by address in ${(end - start) / 1000} sec`
  );
  return dm;
};

type GetDmByAddressByAccountParams = {
  account: string;
  address: string;
  includeSync?: boolean;
};

export const getDmByAddressByAccount = async ({
  account,
  address,
  includeSync = false,
}: GetDmByAddressByAccountParams) => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  if (!client) {
    throw new Error("Client not found");
  }
  return getDmByAddress({ client, address, includeSync });
};

type GetGroupByTopicParams = {
  client: ConverseXmtpClientType;
  topic: ConversationTopic;
  includeSync?: boolean;
};

export const getGroupByTopic = async ({
  client,
  topic,
  includeSync = false,
}: GetGroupByTopicParams) => {
  logger.debug(`[XMTPRN Conversations] Getting group by topic: ${topic}`);
  const start = new Date().getTime();
  let group = await client.conversations.findGroup(getV3IdFromTopic(topic));
  if (!group) {
    logger.debug(
      `[XMTPRN Conversations] Group ${topic} not found, syncing conversations`
    );
    const syncStart = new Date().getTime();
    await client.conversations.sync();
    const syncEnd = new Date().getTime();
    logger.debug(
      `[XMTPRN Conversations] Synced conversations in ${
        (syncEnd - syncStart) / 1000
      } sec`
    );
    group = await client.conversations.findGroup(getV3IdFromTopic(topic));
  }
  if (!group) {
    throw new Error(`Group ${topic} not found`);
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
    `[XMTPRN Conversations] Got dm by address in ${(end - start) / 1000} sec`
  );
  return group;
};

type GetGroupByTopicByAccountParams = {
  account: string;
  topic: ConversationTopic;
  includeSync?: boolean;
};

export const getGroupByTopicByAccount = async ({
  account,
  topic,
  includeSync = false,
}: GetGroupByTopicByAccountParams) => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  return getGroupByTopic({ client, topic, includeSync });
};

type CreateConversationParams = {
  client: ConverseXmtpClientType;
  peerAddress: string;
};

export const createConversation = async ({
  client,
  peerAddress,
}: CreateConversationParams) => {
  logger.info(`[XMTP] Creating a conversation with peer ${peerAddress}`);
  const conversation = await client.conversations.findOrCreateDm(peerAddress);
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

type CreateGroupParams = {
  client: ConverseXmtpClientType;
  peers: string[];
  permissionPolicySet: PermissionPolicySet;
  groupName?: string;
  groupPhoto?: string;
  groupDescription?: string;
};

export const createGroup = async ({
  client,
  peers,
  permissionPolicySet,
  groupName,
  groupPhoto,
  groupDescription,
}: CreateGroupParams) => {
  return client.conversations.newGroupCustomPermissions(
    peers,
    permissionPolicySet,
    {
      name: groupName,
      imageUrlSquare: groupPhoto,
      description: groupDescription,
    }
  );
};

type CreateGroupByAccountParams = {
  account: string;
  peers: string[];
  permissionPolicySet: PermissionPolicySet;
  groupName?: string;
  groupPhoto?: string;
  groupDescription?: string;
};

export const createGroupByAccount = async ({
  account,
  peers,
  permissionPolicySet,
  groupName,
  groupPhoto,
  groupDescription,
}: CreateGroupByAccountParams) => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  return createGroup({
    client,
    peers,
    permissionPolicySet,
    groupName,
    groupPhoto,
    groupDescription,
  });
  // if (groupName) {
  //   setGroupNameQueryData(account, group.topic, groupName);
  // }
  // if (groupPhoto) {
  //   setGroupPhotoQueryData(account, group.topic, groupPhoto);
  // }
  // if (groupDescription) {
  //   setGroupDescriptionQueryData(account, group.topic, groupDescription);
  // }
  // await handleNewConversation(client, group);
};

type RefreshProtocolConversationParams = {
  client: ConverseXmtpClientType;
  topic: ConversationTopic;
};

export const refreshProtocolConversation = async ({
  client,
  topic,
}: RefreshProtocolConversationParams) => {
  return getConversationByTopic({ client, topic, includeSync: true });
};

type RefreshProtocolConversationByAccountParams = {
  account: string;
  topic: ConversationTopic;
};

export const refreshProtocolConversationByAccount = async ({
  account,
  topic,
}: RefreshProtocolConversationByAccountParams) => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  return refreshProtocolConversation({ client, topic });
};

type GetConversationByPeerParams = {
  client: ConverseXmtpClientType;
  peer: string;
  includeSync?: boolean;
};

export const getConversationByPeer = async ({
  client,
  peer,
  includeSync = false,
}: GetConversationByPeerParams) => {
  logger.debug(`[XMTPRN Conversations] Getting conversation by peer: ${peer}`);
  const start = new Date().getTime();

  logger.debug(`[XMTPRN Conversations] Finding DM by address: ${peer}`);
  const findStart = new Date().getTime();
  let conversation = await client.conversations.findDmByAddress(peer);
  const findEnd = new Date().getTime();
  logger.debug(
    `[XMTPRN Conversations] Find DM took ${(findEnd - findStart) / 1000} sec`
  );

  if (!conversation) {
    logger.debug(
      `[XMTPRN Conversations] Conversation ${peer} not found, syncing conversations`
    );
    const syncStart = new Date().getTime();
    await client.conversations.sync();
    const syncEnd = new Date().getTime();
    logger.debug(
      `[XMTPRN Conversations] Synced conversations in ${
        (syncEnd - syncStart) / 1000
      } sec`
    );

    logger.debug(`[XMTPRN Conversations] Retrying find DM by address: ${peer}`);
    const retryFindStart = new Date().getTime();
    conversation = await client.conversations.findDmByAddress(peer);
    const retryFindEnd = new Date().getTime();
    logger.debug(
      `[XMTPRN Conversations] Retry find DM took ${
        (retryFindEnd - retryFindStart) / 1000
      } sec`
    );
  }

  if (!conversation) {
    logger.error(
      `[XMTPRN Conversations] Conversation with peer ${peer} not found after sync`
    );
    throw new Error(`Conversation with peer ${peer} not found`);
  }

  if (includeSync) {
    logger.debug(
      `[XMTPRN Conversations] Syncing conversation with peer ${peer}`
    );
    const syncStart = new Date().getTime();
    await conversation.sync();
    const syncEnd = new Date().getTime();
    logger.debug(
      `[XMTPRN Conversations] Synced conversation in ${
        (syncEnd - syncStart) / 1000
      } sec`
    );
  }

  const end = new Date().getTime();
  logger.debug(
    `[XMTPRN Conversations] Total time to get conversation by peer: ${
      (end - start) / 1000
    } sec`
  );
  return conversation;
};

type GetConversationByPeerByAccountParams = {
  account: string;
  peer: string;
  includeSync?: boolean;
};

export const getConversationByPeerByAccount = async ({
  account,
  peer,
  includeSync = false,
}: GetConversationByPeerByAccountParams) => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  return getConversationByPeer({ client, peer, includeSync });
};

export const getPeerAddressDm = async (dm: DmWithCodecsType) => {
  const peerInboxId = await dm.peerInboxId();
  const peerAddress = (await dm.members()).find(
    (member) => member.inboxId === peerInboxId
  )?.addresses[0];
  return peerAddress;
};

export const getPeerAddressFromTopic = async (
  account: string,
  topic: ConversationTopic
) => {
  const dm = await getConversationByTopicByAccount({
    account,
    topic,
    includeSync: false,
  });
  if (dm.version === ConversationVersion.DM) {
    const peerAddress = await getPeerAddressDm(dm);
    return peerAddress;
  }
  throw new Error("Conversation is not a DM");
};
