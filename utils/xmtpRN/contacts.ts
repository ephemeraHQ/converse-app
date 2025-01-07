import { InboxId } from "@xmtp/react-native-sdk";

import logger from "@utils/logger";
import { ConverseXmtpClientType, DmWithCodecsType } from "./client.types";
import { getOrBuildXmtpClient } from "./sync";
import { xmtpClientByInboxId } from "./client";
import { getCurrentInboxId } from "@/data/store/accountsStore";
import { getInbox } from "./conversations";

type ConsentType = "allow" | "deny";

// type RefreshConsentListParams = {
//   client: ConverseXmtpClientType;
// };

// export const refreshConsentList = async ({
//   client,
// }: RefreshConsentListParams) => {
//   logger.debug("[XMTPRN Contacts] Refreshing consent list");
//   const start = new Date().getTime();
//   // const consentList = await client.preferences.;
//   const end = new Date().getTime();
//   logger.debug(
//     `[XMTPRN Contacts] Refreshed consent list in ${(end - start) / 1000} sec`
//   );
//   // return consentList;
// };

// type RefreshConsentListByAccountParams = {
//   account: string;
// };

// export const refreshConsentListByAccount = async ({
//   account,
// }: RefreshConsentListByAccountParams) => {
//   logger.debug("[XMTPRN Contacts] Refreshing consent list");
//   const start = new Date().getTime();
//   const client = (await getOrBuildXmtpClient(
//     account
//   )) as ConverseXmtpClientType;
//   const consentList = await refreshConsentList({ client });
//   const end = new Date().getTime();
//   logger.debug(
//     `[XMTPRN Contacts] Refreshed consent list in ${(end - start) / 1000} sec`
//   );
//   return consentList;
// };

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

type ConsentToAddressesOnProtocolByAccountParams = {
  account: string;
  addresses: string[];
  consent: ConsentType;
};

export const consentToAddressesOnProtocolByAccount = async ({
  account,
  addresses,
  consent,
}: ConsentToAddressesOnProtocolByAccountParams) => {
  // const client = (await getOrBuildXmtpClient(
  //   account
  // )) as ConverseXmtpClientType;
  if (!client) {
    throw new Error("Client not found");
  }
  await consentToAddressesOnProtocol({ client, addresses, consent });
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
  inboxId: string;
  inboxIds: InboxId[];
  consent: ConsentType;
};

export const consentToInboxIdsOnProtocolForCurrentUser = async ({
  inboxIds,
  consent,
}: Omit<ConsentToInboxIdsOnProtocolByInboxIdParams, "inboxId">) => {
  const currentInboxId = getCurrentInboxId();
  if (!currentInboxId) {
    logger.warn(
      "[consentToInboxIdsOnProtocolForCurrentUser] No current inboxId; noop"
    );
    return;
  }
  const client = xmtpClientByInboxId[currentInboxId];
  if (!client) {
    logger.warn(
      `[consentToInboxIdsOnProtocolForCurrentUser] No client found for ${currentInboxId}`
    );
    return;
  }
  return consentToInboxIdsOnProtocol({ client, inboxIds, consent });
};

export const consentToInboxIdsOnProtocolByInboxId = async ({
  inboxId,
  inboxIds,
  consent,
}: ConsentToInboxIdsOnProtocolByInboxIdParams) => {
  const client = (await getInbox({
    inboxId,
    caller: "consentToInboxIdsOnProtocolByInboxId",
    ifNotFoundStrategy: "throw",
  })) as ConverseXmtpClientType;
  await consentToInboxIdsOnProtocol({ client, inboxIds, consent });
};

type ConsentToGroupsOnProtocolParams = {
  client: ConverseXmtpClientType;
  groupIds: string[];
  consent: "allow" | "deny";
};

export const consentToGroupsOnProtocol = async ({
  client,
  groupIds,
  consent,
}: ConsentToGroupsOnProtocolParams) => {
  logger.debug(
    `[XMTPRN Contacts] Consenting to groups on protocol: ${groupIds.join(", ")}`
  );
  const start = new Date().getTime();
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

export const consentToGroupsOnProtocolByAccount = async (args: {
  account: string;
  groupIds: string[];
  consent: "allow" | "deny";
}) => {
  const { account, groupIds, consent } = args;
  const client = (await getOrBuildXmtpClient(
    account
  )) as ConverseXmtpClientType;
  if (!client) {
    throw new Error("Client not found");
  }
  return consentToGroupsOnProtocol({ client, groupIds, consent });
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

type CanMessageByAccountParams = {
  inboxId: string | undefined;
  peer: string;
};

export const canMessageByAccount = async ({
  inboxId,
  peer,
}: CanMessageByAccountParams) => {
  if (!inboxId) {
    logger.warn(`[canMessageByAccount] No currentInbox provided`);
    return false;
  }
  const client = xmtpClientByInboxId[inboxId];
  if (!client) {
    logger.warn(`[canMessageByAccount] No client found for ${inboxId}`);
    return false;
  }
  return canMessage({ client, peer });
};

export const getDmPeerInbox = async (dm: DmWithCodecsType) => {
  return dm.peerInboxId();
};
