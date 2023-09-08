import { Client } from "@xmtp/react-native-sdk";

import config from "../../config";
import { getChatStore, getUserStore } from "../../data/store/accountsStore";
import { loadXmtpKey } from "../keychain";
import { loadConversations, streamConversations } from "./conversations";
import { loadConversationsMessages, streamAllMessages } from "./messages";

const env = config.xmtpEnv === "production" ? "production" : "dev";

export const getXmtpClientFromBase64Key = (base64Key: string) =>
  Client.createFromKeyBundle(base64Key, { env });

const xmtpClientByAccount: { [account: string]: Client } = {};

export const getXmtpClient = async (account: string) => {
  console.log(`[XmtpRN] Getting client for ${account}`);
  if (account && xmtpClientByAccount[account]) {
    return xmtpClientByAccount[account];
  }
  const base64Key = await loadXmtpKey(account);
  if (base64Key) {
    const client = await getXmtpClientFromBase64Key(base64Key);
    console.log(`[XmtpRN] Instantiated client for ${client.address}`);
    getUserStore(account).getState().setUserAddress(client.address);
    getChatStore(account).getState().setLocalClientConnected(true);
    xmtpClientByAccount[client.address] = client;
    return client;
  }
  throw new Error(`[XmtpRN] No client found for ${account}`);
};

export const syncXmtpClient = async (
  account: string,
  knownTopics: string[],
  lastSyncedAt: number
) => {
  console.log(`[XmtpRN] Syncing ${account}`);
  const now = new Date().getTime();
  const client = await getXmtpClient(account);
  const { newConversations, knownConversations } = await loadConversations(
    client,
    knownTopics
  );

  const promises = [];

  if (knownConversations.length > 0) {
    promises.push(
      loadConversationsMessages(client, knownConversations, lastSyncedAt)
    );
  }

  if (newConversations.length > 0) {
    promises.push(loadConversationsMessages(client, newConversations, 0));
  }

  streamAllMessages(client);
  streamConversations(client);

  await Promise.all(promises);

  // Need to save initial load is done
  getChatStore(account).getState().setInitialLoadDone();
  getChatStore(account).getState().setLastSyncedAt(now);
};
