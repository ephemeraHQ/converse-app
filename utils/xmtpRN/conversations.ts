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
import { xmtpClientByInboxId } from "./client";
import { getCurrentInboxId } from "@/data/store/accountsStore";

export const streamConversations = async ({ inboxId }: { inboxId: string }) => {
  await stopStreamingConversations({ inboxId });

  const client = (await getInbox({
    caller: "conversations#streamConversations",
    ifNotFoundStrategy: "throw",
  })) as ConverseXmtpClientType;

  await client.conversations.stream(async (conversation) => {
    logger.info("[XMTPRN Conversations] GOT A NEW CONVO");
    addConversationToConversationListQuery({ inboxId, conversation });
  });
  logger.info("STREAMING CONVOS");
};

export const stopStreamingConversations = async ({
  inboxId,
}: {
  inboxId: string;
}) => {
  const client: ConverseXmtpClientType = xmtpClientByInboxId[inboxId];
  if (!client) {
    throw new Error(
      "[XMTPRN Conversations#stopStreamingConversations] Client not found"
    );
  }
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

// export const listConversationsByAccount = async (args: {
//   account: string;
//   includeSync?: boolean;
//   order?: ConversationOrder;
//   limit?: number;
//   opts?: ConversationOptions;
// }) => {
//   const { account, includeSync = false, order, limit, opts } = args;
//   logger.debug("[XMTPRN Conversations] Listing conversations by account");
//   const start = new Date().getTime();
//   const client = (await getOrBuildXmtpClient(
//     account
//   )) as ConverseXmtpClientType;
//   if (!client) {
//     throw new Error("Client not found");
//   }
//   const conversations = await listConversations({
//     client,
//     includeSync,
//     order,
//     limit,
//     opts,
//   });
//   const end = new Date().getTime();
//   logger.debug(
//     `[XMTPRN Conversations] Listed conversations in ${(end - start) / 1000} sec`
//   );
//   return conversations;
// };

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

// export async function getGroupByTopicByAccount(args: {
//   account: string;
//   topic: ConversationTopic;
//   includeSync?: boolean;
// }) {
//   const { account, topic, includeSync = false } = args;
//   const client = (await getOrBuildXmtpClient(
//     account
//   )) as ConverseXmtpClientType;
//   return getGroupByTopic({
//     client,
//     topic,
//     includeSync,
//   });
// }

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

export const createConversationByAccount = async (args: {
  inboxId: string | undefined;
  peerAddress: string;
}) => {
  const { inboxId, peerAddress } = args;
  if (!inboxId) {
    throw new Error("[createConversationByAccount] Inbox ID is required");
  }
  const client: ConverseXmtpClientType = xmtpClientByInboxId[inboxId];
  if (!client) {
    throw new Error("[createConversationByAccount] Client not found");
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

/**
 * Gets the XMTP client for the specified user's inbox. Defaults to the current user's inbox.
 *
 * Retrieves the XMTP client instance associated with the given
 * inbox ID or the current inbox. Handles error cases based on
 * the provided strategy.
 *
 * @param {Object} args - The function arguments
 * @param {string} [args.inboxId] - Optional inbox ID to look up; defaults to the current user's inbox
 * @param {string} args.caller - Name of calling function for logs
 * @param {string} [args.ifNotFoundStrategy] - How to handle errors:
 *   - "throw": Throw an error if client not found
 *   - "logAndReturnUndefined": Log error and return undefined
 *
 * @returns {Promise<ConverseXmtpClientType | undefined>} The XMTP client or undefined if not found and using logAndReturnUndefined strategy;
 * throws an error if client not found and using throw strategy
 *
 * @throws {Error} If client not found and using throw strategy
 *
 * @example
 * // Get client and throw if not found
 * const client = await getInbox({
 *   caller: "myFunction",
 *   ifNotFoundStrategy: "throw"
 * });
 *
 * @example
 * // Get client and handle not found case
 * const client = await getInbox({
 *   inboxId: "123",
 *   caller: "myFunction",
 *   ifNotFoundStrategy: "logAndReturnUndefined"
 * });
 */
export const getInbox = async (args: {
  inboxId?: string;
  caller: string;
  ifNotFoundStrategy?: "throw" | "logAndReturnUndefined";
}): Promise<ConverseXmtpClientType | undefined> => {
  const { caller, ifNotFoundStrategy = "logAndReturnUndefined" } = args;
  const inboxId = args.inboxId || getCurrentInboxId();
  let message = "";
  let error: Error | undefined;
  if (!inboxId) {
    message = `[${caller}] Inbox ID is required`;
    error = new Error(message);
  }
  const client = xmtpClientByInboxId[inboxId!];
  if (!client) {
    message = `[${caller}] Client not found`;
    error = new Error(message);
  }
  if (error) {
    if (ifNotFoundStrategy === "throw") {
      throw error;
    } else if (ifNotFoundStrategy === "logAndReturnUndefined") {
      logger.error(message);
      return undefined;
    }
  }

  return client;
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
  const client = (await getInbox({
    caller: "createGroupForCurrentUser",
    ifNotFoundStrategy: "throw",
  })) as ConverseXmtpClientType;
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

// export const refreshProtocolConversationByAccount = async (args: {
//   account: string;
//   topic: ConversationTopic;
// }) => {
//   const { account, topic } = args;
//   const client = (await getOrBuildXmtpClient(
//     account
//   )) as ConverseXmtpClientType;
//   return refreshProtocolConversation({ client, topic });
// };

export const getConversationByPeerByInboxId = async (args: {
  inboxId?: string;
  peer: string;
  includeSync?: boolean;
}) => {
  const { inboxId, peer, includeSync = false } = args;
  if (!inboxId) {
    throw new Error("[getConversationByPeerByInboxId] Inbox ID is required");
  }
  const client: ConverseXmtpClientType = xmtpClientByInboxId[inboxId];
  if (!client) {
    throw new Error("[getConversationByPeerByInboxId] Client not found");
  }
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
