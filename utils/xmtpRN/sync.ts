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
  stopStreamingGroups,
  streamConversations,
  streamGroups,
  updateConsentStatus,
} from "./conversations";
import {
  syncConversationsMessages,
  stopStreamingAllMessage,
  streamAllMessages,
  syncGroupsMessages,
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
    console.log("already instantiating sorry");
    await new Promise((r) => setTimeout(r, 200));
    return getXmtpClient(account);
  }
  instantiatingClientForAccount[account] = true;
  try {
    console.log("loading base64 key");
    const base64Key = await loadXmtpKey(account);
    if (base64Key) {
      console.log("get client from base64 key");
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
  const queryGroupsFromTimestamp: { [topic: string]: number } = {};
  knownTopics.forEach((topic) => {
    if (getChatStore(account).getState().conversations[topic]?.isGroup) {
      queryGroupsFromTimestamp[topic] = lastSyncedAt;
    } else {
      queryConversationsFromTimestamp[topic] = lastSyncedAt;
    }
  });
  try {
    const now = new Date().getTime();
    updateConsentStatus(account);
    const { newConversations, groups, newGroups } = await loadConversations(
      account,
      knownTopics
    );
    newConversations.forEach((c) => {
      queryConversationsFromTimestamp[c.topic] = 0;
    });
    newGroups.forEach((g) => {
      queryGroupsFromTimestamp[g.topic] = 0;
    });
    // As soon as we have done one query we can hide reconnecting
    getChatStore(account).getState().setReconnecting(false);

    await streamConversations(account).catch((e) => {
      onSyncLost(account, e);
    });
    await streamGroups(account).catch((e) => onSyncLost(account, e));
    // Streaming all dm messages (not groups because buggy)
    await streamAllMessages(account).catch((e) => {
      onSyncLost(account, e);
    });
    streamingAccounts[account] = true;

    console.log("RECALLING syncConversationsMessages / syncGroupsMessages");
    const [fetchedMessagesCount, fetchedGroupMessagesCount] = await Promise.all(
      [
        syncConversationsMessages(account, queryConversationsFromTimestamp),
        syncGroupsMessages(account, groups, queryGroupsFromTimestamp),
      ]
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
    if (fetchedMessagesCount > 0 || fetchedGroupMessagesCount > 0) {
      const conversationTopicsToQuery = Object.keys(
        queryConversationsFromTimestamp
      );
      const groupTopicsToQuery = Object.keys(queryGroupsFromTimestamp);
      getChatStore(account)
        .getState()
        .setLastSyncedAt(now, [
          ...conversationTopicsToQuery,
          ...groupTopicsToQuery,
        ]);
    }
    console.log(`[XmtpRN] Finished syncing ${account}`);
  } catch (e) {
    console.log("main sync error");
    onSyncLost(account, e);
  }
};

export const deleteXmtpClient = async (account: string) => {
  if (account in xmtpClientByAccount) {
    stopStreamingAllMessage(account);
    stopStreamingConversations(account);
    stopStreamingGroups(account);
  }
  delete xmtpClientByAccount[account];
  deleteOpenedConversations(account);
  delete xmtpSignatureByAccount[account];
  delete instantiatingClientForAccount[account];
  delete streamingAccounts[account];
};
