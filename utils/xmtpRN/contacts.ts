import { InboxId } from "@xmtp/react-native-sdk";

import logger from "@utils/logger";
import { ConverseXmtpClientType, DmWithCodecsType } from "./client.types";
import { getCurrentInboxId } from "@/data/store/accountsStore";
import { getXmtpClient } from "@/features/Accounts/accounts.utils";
import { getXmtpClientOrThrow } from "@/features/Accounts/accounts.utils";
type ConsentType = "allow" | "deny";

type ConsentToAddressesOnProtocolParams = {
  client: ConverseXmtpClientType;
  addresses: string[];
  consent: ConsentType;
};

export const consentToAddressesOnProtocol = async ({
  client,
  addresses,
  consent,
}: ConsentToAddressesOnProtocolParams): Promise<void> => {
  logger.debug(
    `[XMTPRN Contacts] Consenting to addresses on protocol: ${addresses.join(
      ", "
    )}`
  );
  const start = new Date().getTime();
  if (consent === "allow") {
    for (const address of addresses) {
      await client.preferences.setConsentState({
        value: address,
        entryType: "address",
        state: "allowed",
      });
    }
  } else if (consent === "deny") {
    for (const address of addresses) {
      await client.preferences.setConsentState({
        value: address,
        entryType: "address",
        state: "denied",
      });
    }
  } else {
    throw new Error(`Invalid consent type: ${consent}`);
  }
  const end = new Date().getTime();
  logger.debug(
    `[XMTPRN Contacts] Consented to addresses on protocol in ${
      (end - start) / 1000
    } sec`
  );
};

type ConsentToInboxIdsOnProtocolParams = {
  client: ConverseXmtpClientType;
  inboxIds: InboxId[];
  consent: ConsentType;
};

export const consentToInboxIdsOnProtocol = async ({
  client,
  inboxIds,
  consent,
}: ConsentToInboxIdsOnProtocolParams): Promise<void> => {
  logger.debug(
    `[XMTPRN Contacts] Consenting to inboxIds on protocol: ${inboxIds.join(
      ", "
    )}`
  );
  const start = new Date().getTime();
  if (consent === "allow") {
    for (const inboxId of inboxIds) {
      await client.preferences.setConsentState({
        value: inboxId,
        entryType: "inbox_id",
        state: "allowed",
      });
    }
  } else if (consent === "deny") {
    for (const inboxId of inboxIds) {
      await client.preferences.setConsentState({
        value: inboxId,
        entryType: "inbox_id",
        state: "denied",
      });
    }
  } else {
    throw new Error(`Invalid consent type: ${consent}`);
  }
  const end = new Date().getTime();
  logger.debug(
    `[XMTPRN Contacts] Consented to inboxIds on protocol in ${
      (end - start) / 1000
    } sec`
  );
};

type ConsentToInboxIdsOnProtocolByInboxIdParams = {
  inboxId: InboxId;
  inboxIds: InboxId[];
  consent: ConsentType;
};

export const consentToInboxIdsOnProtocolForCurrentUser = async ({
  inboxIds,
  consent,
}: Omit<ConsentToInboxIdsOnProtocolByInboxIdParams, "inboxId">) => {
  const currentInboxId = getCurrentInboxId();
  const client = await getXmtpClientOrThrow({
    inboxId: currentInboxId,
    caller: "consentToInboxIdsOnProtocolForCurrentUser",
  });
  return await consentToInboxIdsOnProtocol({ client, inboxIds, consent });
};

export const consentToInboxIdsOnProtocolByInboxId = async ({
  inboxId,
  inboxIds,
  consent,
}: ConsentToInboxIdsOnProtocolByInboxIdParams) => {
  const client = await getXmtpClient({
    inboxId,
    caller: "consentToInboxIdsOnProtocolByInboxId",
    ifNotFoundStrategy: "throw",
  });
  return await consentToInboxIdsOnProtocol({ client, inboxIds, consent });
};

type ConsentToGroupsOnProtocolParams = {
  inboxId: InboxId;
  groupIds: string[];
  consent: "allow" | "deny";
};

export const consentToGroupsByGroupIds = async (
  args: ConsentToGroupsOnProtocolParams
) => {
  const { inboxId, groupIds, consent } = args;
  logger.debug(
    `[XMTPRN Contacts] Consenting to groups on protocol: ${groupIds.join(", ")}`
  );
  const start = new Date().getTime();
  const client = await getXmtpClient({
    inboxId,
    caller: "consentToGroupsByGroupIds",
    ifNotFoundStrategy: "throw",
  });

  if (consent === "allow") {
    for (const groupId of groupIds) {
      await client.preferences.setConsentState({
        value: groupId,
        entryType: "conversation_id",
        state: "allowed",
      });
    }
  } else if (consent === "deny") {
    for (const groupId of groupIds) {
      await client.preferences.setConsentState({
        value: groupId,
        entryType: "conversation_id",
        state: "denied",
      });
    }
  } else {
    throw new Error(`Invalid consent type: ${consent}`);
  }
  const end = new Date().getTime();
  logger.debug(
    `[XMTPRN Contacts] Consented to groups on protocol in ${
      (end - start) / 1000
    } sec`
  );
};

type CanMessageParams = {
  client: ConverseXmtpClientType;
  peer: string;
};

export const canMessage = async ({ peer, client }: CanMessageParams) => {
  logger.debug(`[XMTPRN Conversations] Checking if can message ${peer}`);
  const start = new Date().getTime();
  const canMessage = await client.canMessage([peer]);
  const end = new Date().getTime();
  logger.debug(
    `[XMTPRN Conversations] Checked if can message ${peer} in ${
      (end - start) / 1000
    } sec`
  );
  return canMessage[peer.toLowerCase()];
};

type CanMessageByInboxIdParams = {
  inboxId: InboxId;
  peer: string;
};

export const canMessageByAccount = async ({
  inboxId,
  peer,
}: CanMessageByInboxIdParams) => {
  // if (!inboxId) {
  //   logger.warn(`[canMessageByAccount] No currentInbox provided`);
  //   return false;
  // }
  // const client = xmtpClientByInboxId[inboxId];
  // if (!client) {
  //   logger.warn(`[canMessageByAccount] No client found for ${inboxId}`);
  //   return false;
  // }
  const client = await getXmtpClient({
    inboxId,
    caller: "canMessageByAccount",
    ifNotFoundStrategy: "throw",
  });
  return canMessage({ client, peer });
};

export const getDmPeerInbox = async (dm: DmWithCodecsType) => {
  return dm.peerInboxId();
};
