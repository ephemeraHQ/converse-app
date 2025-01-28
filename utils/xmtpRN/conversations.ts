import { getCurrentAccount } from "@/data/store/accountsStore";
import { getProfileSocialsQueryData } from "@/queries/useProfileSocialsQuery";
import { getV3IdFromTopic } from "@utils/groupUtils/groupId";
import logger from "@utils/logger";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { PermissionPolicySet } from "@xmtp/react-native-sdk/build/lib/types/PermissionPolicySet";
import { getPreferredName } from "../profile";
import {
  ConversationWithCodecsType,
  ConverseXmtpClientType,
  DmWithCodecsType,
} from "./xmtp-client/xmtp-client.types";
import { getXmtpClient } from "./xmtp-client/xmtp-client";
import { streamAllMessages } from "./xmtp-messages/xmtp-messages-stream";

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
    `[XMTPRN Conversations] Initial lookup took ${
      (lookupEnd - lookupStart) / 1000
    } sec`
  );

  if (!group) {
    logger.debug(
      `[XMTPRN Conversations] Group not found, syncing conversations`
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
    if (!group) {
      throw new Error(`Group ${topic} not found`);
    }
  }

  if (includeSync) {
    const syncStart = new Date().getTime();
    await group.sync();
    const syncEnd = new Date().getTime();
    logger.debug(
      `[XMTPRN Conversations] Synced group in ${
        (syncEnd - syncStart) / 1000
      } sec`
    );
  }

  const end = new Date().getTime();
  logger.debug(
    `[XMTPRN Conversations] Total time to get group: ${
      (end - start) / 1000
    } sec`
  );

  return group;
}

async function findDm(args: {
  client: ConverseXmtpClientType;
  peer: string;
  includeSync?: boolean;
  throwIfNotFound?: boolean;
}) {
  const {
    client,
    peer,
    includeSync = false,
    /** this shouldnt throw, but that was default behavior so maintaining for now */ throwIfNotFound = true,
  } = args;
  logger.debug(`[XMTPRN Conversations] Getting DM by ${peer}`);
  const start = new Date().getTime();

  const lookupStart = new Date().getTime();
  let dm = await client.conversations.findDmByAddress(peer);
  const lookupEnd = new Date().getTime();
  logger.debug(
    `[XMTPRN Conversations] Initial lookup took ${
      (lookupEnd - lookupStart) / 1000
    } sec`
  );

  if (!dm) {
    logger.debug(`[XMTPRN Conversations] DM not found, syncing conversations`);
    const syncStart = new Date().getTime();
    await client.conversations.sync();
    const syncEnd = new Date().getTime();
    logger.debug(
      `[XMTPRN Conversations] Synced conversations in ${
        (syncEnd - syncStart) / 1000
      } sec`
    );

    dm = await client.conversations.findDmByAddress(peer);
    if (!dm) {
      if (throwIfNotFound) {
        throw new Error(`DM with peer ${peer} not found`);
      } else {
        return undefined;
      }
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

export const getConversationByPeer = async (args: {
  client: ConverseXmtpClientType;
  peer: string;
  includeSync?: boolean;
  throwIfNotFound?: boolean;
}) => {
  const { client, peer, includeSync = false, throwIfNotFound = true } = args;
  return findDm({
    client,
    peer,
    includeSync,
    throwIfNotFound,
  });
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

export const defaultPermissionPolicySet: PermissionPolicySet = {
  addMemberPolicy: "allow",
  removeMemberPolicy: "admin",
  addAdminPolicy: "superAdmin",
  removeAdminPolicy: "superAdmin",
  updateGroupNamePolicy: "allow",
  updateGroupDescriptionPolicy: "allow",
  updateGroupImagePolicy: "allow",
  updateGroupPinnedFrameUrlPolicy: "allow",
  updateMessageExpirationPolicy: "allow",
};

const createGroupName = (peerEthereumAddresses: string[]) => {
  const currentAccount = getCurrentAccount()!;
  const firstThreeMembers = peerEthereumAddresses.slice(0, 3);
  const currentAccountSocials =
    getProfileSocialsQueryData(currentAccount, currentAccount) ?? undefined;
  let groupName = getPreferredName(currentAccountSocials, currentAccount);
  if (firstThreeMembers.length) {
    groupName += ", ";
  }
  for (let i = 0; i < firstThreeMembers.length; i++) {
    const member = firstThreeMembers[i];
    const memberSocials = getProfileSocialsQueryData(currentAccount, member);
    groupName += getPreferredName(memberSocials, member);
    if (i < firstThreeMembers.length - 1) {
      groupName += ", ";
    }
  }
  return groupName;
};

export const createGroupWithDefaultsByAccount = async (args: {
  account: string;
  peerEthereumAddresses: string[];
}) => {
  const { account, peerEthereumAddresses } = args;

  const groupName = createGroupName(peerEthereumAddresses);

  return createGroupByAccount({
    account,
    peers: peerEthereumAddresses,
    permissionPolicySet: defaultPermissionPolicySet,
    groupName,
  });
};

export const createGroupByAccount = async (args: {
  account: string;
  peers: string[];
  permissionPolicySet: PermissionPolicySet;
  groupName?: string;
  groupPhoto?: string;
  groupDescription?: string;
}) => {
  const {
    account,
    peers,
    permissionPolicySet,
    groupName,
    groupPhoto,
    groupDescription,
  } = args;
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

export const getConversationByPeerByAccount = async (args: {
  account: string;
  peer: string;
}) => {
  const { account, peer } = args;
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  return getConversationByPeer({ client, peer });
};

export const getOptionalConversationByPeerByAccount = async (args: {
  account: string;
  peer: string;
  includeSync?: boolean;
}) => {
  const { account, peer, includeSync = false } = args;
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  return getConversationByPeer({
    client,
    peer,
    includeSync,
    throwIfNotFound: false,
  });
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
