import { Client } from "@xmtp/xmtp-js";

import { refreshAllSpamScores } from "../../data/helpers/conversations/spamScore";
import { getChatStore } from "../../data/store/accountsStore";
import { loadXmtpKey } from "../keychain/helpers";
import { xmtpSignatureByAccount } from "./api";
import {
  ConverseXmtpClientType,
  getXmtpClientFromBase64Key,
  xmtpClientByAccount,
} from "./client";
import {
  deleteOpenedConversations,
  loadConversations,
  stopStreamingConversations,
  streamConversations,
  updateConsentStatus,
} from "./conversations";
import {
  loadConversationsMessages,
  stopStreamingAllMessage,
  streamAllMessages,
} from "./messages";

const instantiatingClientForAccount: { [account: string]: boolean } = {};

export const getXmtpClient = async (
  account: string
): Promise<ConverseXmtpClientType | Client> => {
  console.log(`[XmtpRN] Getting client for ${account}`);
  if (account && xmtpClientByAccount[account]) {
    return xmtpClientByAccount[account];
  }
  if (instantiatingClientForAccount[account]) {
    // Avoid instantiating 2 clients for the same account
    // which leads to buggy behaviour
    await new Promise((r) => setTimeout(r, 200));
    return getXmtpClient(account);
  }
  instantiatingClientForAccount[account] = true;
  try {
    const base64Key = await loadXmtpKey(account);
    if (base64Key) {
      const client = await getXmtpClientFromBase64Key(base64Key);
      console.log(`[XmtpRN] Instantiated client for ${client.address}`);
      getChatStore(account).getState().setLocalClientConnected(true);
      xmtpClientByAccount[client.address] = client;
      delete instantiatingClientForAccount[account];
      return client;
    }
  } catch (e) {
    delete instantiatingClientForAccount[account];
    throw e;
  }
  delete instantiatingClientForAccount[account];
  throw new Error(`[XmtpRN] No client found for ${account}`);
};

const onSyncLost = async (account: string, error: any) => {
  console.log(
    `[XmtpRN] An error occured while syncing for ${account}: ${error}`
  );
  // If there is an error let's show it
  getChatStore(account).getState().setReconnecting(true);
  // Wait a bit before reco
  await new Promise((r) => setTimeout(r, 1000));
  // Now let's reload !
  syncXmtpClient(account);
};

const streamingAccounts: { [account: string]: boolean } = {};

export const syncXmtpClient = async (account: string) => {
  const lastSyncedAt = getChatStore(account).getState().lastSyncedAt || 0;

  // We just introduced lastSyncedTopics so it might be empty at first
  // Last synced topics enable us not to miss messages from new conversations
  // That we didn't get through notifications
  const lastSyncedTopics =
    getChatStore(account).getState().lastSyncedTopics || [];
  const knownTopics =
    lastSyncedTopics.length > 0
      ? lastSyncedTopics
      : Object.keys(getChatStore(account).getState().conversations);
  console.log(`[XmtpRN] Syncing ${account}`, {
    lastSyncedAt,
    knownTopics: knownTopics.length,
  });
  const queryConversationsFromTimestamp: { [topic: string]: number } = {};
  knownTopics.forEach((topic) => {
    queryConversationsFromTimestamp[topic] = lastSyncedAt;
  });
  try {
    const now = new Date().getTime();
    updateConsentStatus(account);
    const { newConversations } = await loadConversations(account, knownTopics);
    newConversations.forEach((c) => {
      queryConversationsFromTimestamp[c.topic] = 0;
    });
    // As soon as we have done one query we can hide reconnecting
    getChatStore(account).getState().setReconnecting(false);

    streamAllMessages(account).catch((e) => {
      onSyncLost(account, e);
    });
    streamConversations(account).catch((e) => {
      onSyncLost(account, e);
    });
    streamingAccounts[account] = true;
    const topicsToQuery = Object.keys(queryConversationsFromTimestamp);

    const fetchedMessagesCount = await loadConversationsMessages(
      account,
      queryConversationsFromTimestamp
    );

    // Refresh spam scores after the initial load of conversation data is complete
    // Ensure spam scores are current, reflecting any new messages received since the last sync
    if (!getChatStore(account).getState().initialLoadDone) {
      await refreshAllSpamScores(account);
    }

    // Need to save initial load is done
    getChatStore(account).getState().setInitialLoadDone();
    // Only update when we have really fetched, this might mitigate
    // the case where we never fetch some messages
    if (fetchedMessagesCount > 0) {
      getChatStore(account).getState().setLastSyncedAt(now, topicsToQuery);
    }
    console.log(`[XmtpRN] Finished syncing ${account}`);
  } catch (e) {
    onSyncLost(account, e);
  }
};

export const deleteXmtpClient = async (account: string) => {
  if (account in xmtpClientByAccount) {
    stopStreamingAllMessage(account);
    stopStreamingConversations(account);
  }
  delete xmtpClientByAccount[account];
  deleteOpenedConversations(account);
  delete xmtpSignatureByAccount[account];
  delete instantiatingClientForAccount[account];
  delete streamingAccounts[account];
};
