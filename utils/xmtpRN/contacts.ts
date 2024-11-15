import { InboxId } from "@xmtp/react-native-sdk";

import { getXmtpClient } from "./sync";
import { ConverseXmtpClientType } from "./client";
import logger from "@utils/logger";

type ConsentType = "allow" | "deny";

type RefreshConsentListParams = {
  client: ConverseXmtpClientType;
};

export const refreshConsentList = async ({
  client,
}: RefreshConsentListParams) => {
  logger.debug("[XMTPRN Contacts] Refreshing consent list");
  const start = new Date().getTime();
  // const consentList = await client.preferences.;
  const end = new Date().getTime();
  logger.debug(
    `[XMTPRN Contacts] Refreshed consent list in ${(end - start) / 1000} sec`
  );
  // return consentList;
};

type RefreshConsentListByAccountParams = {
  account: string;
};

export const refreshConsentListByAccount = async ({
  account,
}: RefreshConsentListByAccountParams) => {
  logger.debug("[XMTPRN Contacts] Refreshing consent list");
  const start = new Date().getTime();
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  const consentList = await refreshConsentList({ client });
  const end = new Date().getTime();
  logger.debug(
    `[XMTPRN Contacts] Refreshed consent list in ${(end - start) / 1000} sec`
  );
  return consentList;
};

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
        permissionType: "allowed",
      });
    }
  } else if (consent === "deny") {
    for (const address of addresses) {
      await client.preferences.setConsentState({
        value: address,
        entryType: "address",
        permissionType: "denied",
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

export const consentToAddressesOnProtocolByAccount = async (
  account: string,
  addresses: string[],
  consent: ConsentType
) => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
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
        permissionType: "allowed",
      });
    }
  } else if (consent === "deny") {
    for (const inboxId of inboxIds) {
      await client.preferences.setConsentState({
        value: inboxId,
        entryType: "inbox_id",
        permissionType: "denied",
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

export const consentToInboxIdsOnProtocolByAccount = async (
  account: string,
  inboxIds: InboxId[],
  consent: ConsentType
) => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  if (!client) {
    throw new Error("Client not found");
  }
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
        permissionType: "allowed",
      });
    }
  } else if (consent === "deny") {
    for (const groupId of groupIds) {
      await client.preferences.setConsentState({
        value: groupId,
        entryType: "conversation_id",
        permissionType: "denied",
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

export const consentToGroupsOnProtocolByAccount = async (
  account: string,
  groupIds: string[],
  consent: "allow" | "deny"
) => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
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
  return canMessage;
};

type CanMessageByAccountParams = {
  account: string;
  peer: string;
};

export const canMessageByAccount = async ({
  account,
  peer,
}: CanMessageByAccountParams) => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  if (!client) {
    throw new Error("Client not found");
  }
  return canMessage({ client, peer });
};
