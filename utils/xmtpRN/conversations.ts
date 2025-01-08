import { addConversationToConversationListQuery } from "@/queries/useConversationListQuery";
import { getV3IdFromTopic } from "@utils/groupUtils/groupId";
import logger from "@utils/logger";
import {
  ConversationOptions,
  ConversationOrder,
  ConversationTopic,
  InboxId,
} from "@xmtp/react-native-sdk";
import { PermissionPolicySet } from "@xmtp/react-native-sdk/build/lib/types/PermissionPolicySet";
import {
  ConversationWithCodecsType,
  ConverseXmtpClientType,
  DmWithCodecsType,
} from "./client.types";
import { streamAllMessages } from "./messages";
import { xmtpClientByInboxId } from "./client";
import { getCurrentInboxId } from "@/data/store/accountsStore";
import {
  getXmtpClientForCurrentInboxOrThrow,
  getEthereumAddressesForInboxId,
  getXmtpClientOrThrow,
  getXmtpClient,
} from "@/features/Accounts/accounts.utils";

export const streamConversations = async ({
  inboxId,
}: {
  inboxId: InboxId;
}) => {
  await stopStreamingConversations({ inboxId });

  const client = getXmtpClientOrThrow({
    inboxId,
    caller: "conversations#streamConversations",
  });

  await client.conversations.stream(async (conversation) => {
    logger.info("[XMTPRN Conversations] GOT A NEW CONVO");
    addConversationToConversationListQuery({ inboxId, conversation });
  });
  logger.info("STREAMING CONVOS");
};

export const stopStreamingConversations = async ({
  inboxId,
}: {
  inboxId: InboxId;
}) => {
  const client = getXmtpClient({
    inboxId,
    caller: "conversations#stopStreamingConversations",
    ifNotFoundStrategy: "throw",
  });
  return client.conversations.cancelStream();
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
  peerEthereumAddress: string;
  includeSync?: boolean;
}) {
  const { client, peerEthereumAddress, includeSync = false } = args;
  logger.debug(`[XMTPRN Conversations] Getting DM by ${peerEthereumAddress}`);
  const start = new Date().getTime();

  const lookupStart = new Date().getTime();
  // let dm = await client.conversations.findDmByAddress(peerEthereumAddress);
  let dm = await client.conversations.findDmByInboxId(peerEthereumAddress);
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

    dm = await client.conversations.findDmByAddress(peerEthereumAddress);
    if (!dm) {
      throw new Error(
        `DM with peerEthereumAddress ${peerEthereumAddress} not found`
      );
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

export const getConversationByPeerInboxId = async (args: {
  client: ConverseXmtpClientType;
  peerEthereumAddress: string;
  includeSync?: boolean;
}) => {
  const { client, peerEthereumAddress, includeSync = false } = args;
  return findDm({
    client,
    peerEthereumAddress,
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

export const getConversationByTopicByInboxId = async (args: {
  inboxId?: string;
  topic: ConversationTopic;
  includeSync?: boolean;
}) => {
  const { inboxId, topic, includeSync = false } = args;
  if (!inboxId) {
    throw new Error("[getConversationByTopicByInboxId] Inbox ID is required");
  }
  const client: ConverseXmtpClientType = xmtpClientByInboxId[inboxId];
  if (!client) {
    throw new Error("[getConversationByTopicByInboxId] Client not found");
  }
  return getConversationByTopic({ client, topic, includeSync });
};

export const createDmForPeerInboxId = async (args: {
  peerInboxId: InboxId;
}) => {
  const { peerInboxId } = args;
  const client = getXmtpClientForCurrentInboxOrThrow({
    caller: "createDmForPeerInboxId",
  });
  logger.info(`[XMTP] Creating a conversation with peerInboxId ${peerInboxId}`);
  const peerEthereumAddress = await getEthereumAddressesForInboxId({
    inboxId: peerInboxId,
  });
  const conversation =
    await client.conversations.findOrCreateDm(peerEthereumAddress);
  await handleNewConversationCreation(client, conversation);
  return conversation;
};

export const createGroup = async (args: {
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
  const client = getXmtpClientForCurrentInboxOrThrow({
    caller: "createGroupForCurrentUser",
  });
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

export const createGroupForCurrentUser = async (args: {
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

  return createGroup({
    peers,
    permissionPolicySet,
    groupName,
    groupPhoto,
    groupDescription,
  });
};

export const getPeerEthereumAddressFromDm = async (
  dm: DmWithCodecsType
): Promise<string | undefined> => {
  const peerInboxId = await dm.peerInboxId();
  const peerEthereumAddress = (await dm.members()).find(
    (member) => member.inboxId === peerInboxId
  )?.addresses[0];
  return peerEthereumAddress;
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
