import logger from "@utils/logger";
import { Client } from "@xmtp/xmtp-js";
import intersect from "fast_array_intersect";
import { AppState } from "react-native";

import { xmtpSignatureByAccount } from "./api";
import {
  ConverseXmtpClientType,
  getXmtpClientFromBase64Key,
  reconnectXmtpClientsDbConnections,
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
  stopStreamingAllMessage,
  streamAllMessages,
  syncConversationsMessages,
  syncGroupsMessages,
} from "./messages";
import { refreshAllSpamScores } from "../../data/helpers/conversations/spamScore";
import { getAccountsList, getChatStore } from "../../data/store/accountsStore";
import { loadXmtpKey } from "../keychain/helpers";

const instantiatingClientForAccount: {
  [account: string]: Promise<ConverseXmtpClientType | Client> | undefined;
} = {};

export const getXmtpClient = async (
  account: string
): Promise<ConverseXmtpClientType | Client> => {
  if (account && xmtpClientByAccount[account]) {
    return xmtpClientByAccount[account];
  }
  // Return the existing instantiating promise to avoid race condition
  const alreadyInstantiating = instantiatingClientForAccount[account];
  if (alreadyInstantiating) {
    return alreadyInstantiating;
  }
  // Avoid instantiating any 2 clients at the same time to avoid
  // blocking the Expo Async Thread
  if (Object.keys(instantiatingClientForAccount).length > 0) {
    await new Promise((r) => setTimeout(r, 200));
    return getXmtpClient(account);
  }
  instantiatingClientForAccount[account] = (async () => {
    try {
      logger.debug("[XmtpRN] Loading base64 key");
      const base64Key = await loadXmtpKey(account);
      if (base64Key) {
        logger.debug("[XmtpRN] Getting client from base64 key");
        const client = await getXmtpClientFromBase64Key(base64Key);
        logger.info(`[XmtpRN] Instantiated client for ${client.address}`);
        getChatStore(account).getState().setLocalClientConnected(true);
        getChatStore(account).getState().setErrored(false);
        xmtpClientByAccount[client.address] = client;
        return client;
      } else {
        throw new Error(`[XmtpRN] No client found for ${account}`);
      }
    } catch (e: any) {
      getChatStore(account).getState().setErrored(true);
      throw e;
    } finally {
      delete instantiatingClientForAccount[account];
    }
  })();
  return instantiatingClientForAccount[account] as Promise<
    ConverseXmtpClientType | Client
  >;
};

const INITIAL_BACKOFF = 1000; // Initial backoff interval in ms
const MAX_BACKOFF = 60000; // Maximum backoff interval in ms
let currentBackoff = INITIAL_BACKOFF;

const onSyncLost = async (account: string, error: any) => {
  // If there is an error let's show it
  getChatStore(account).getState().setReconnecting(true);
  // If error is a libxmtp database reconnection issue, let's
  // try to reconnect if we're active
  if (
    `${error}`.includes("storage error: Pool needs to  reconnect before use")
  ) {
    if (AppState.currentState === "active") {
      logger.error(
        "Reconnecting XMTP Pool because it didn't reconnect automatically"
      );
      await reconnectXmtpClientsDbConnections();
      logger.debug("Done reconnecting XMTP Pool");
    } else if (AppState.currentState === "background") {
      // This error is normal when backgrounded, fail silently
      // as reopening the app will launch a resync
      return;
    } else {
      logger.error(error, {
        context: `An error occured while syncing for ${account}`,
      });
    }
  } else {
    logger.error(error, {
      context: `An error occured while syncing for ${account}`,
    });
  }
  // Wait a bit before reco
  logger.debug(`[XmtpRN] Reconnecting in ${currentBackoff}ms`);
  await new Promise((r) => setTimeout(r, currentBackoff));
  currentBackoff = Math.min(currentBackoff * 2, MAX_BACKOFF);
  // Now let's reload if this is still an opened account
  if (getAccountsList().includes(account)) {
    syncXmtpClient(account);
  }
};

const streamingAccounts: { [account: string]: boolean } = {};

export const syncXmtpClient = async (account: string) => {
  const lastSyncedAt = getChatStore(account).getState().lastSyncedAt || 0;

  // Last synced topics enable us not to miss messages from new conversations
  // That we didn't get through notifications
  const _lastSyncedTopics =
    getChatStore(account).getState().lastSyncedTopics || [];
  // Making sure we know about those convos in case of database issue
  const lastSyncedTopics = intersect([
    _lastSyncedTopics,
    Object.keys(getChatStore(account).getState().conversations),
  ]);
  const knownTopics =
    lastSyncedTopics.length > 0
      ? lastSyncedTopics
      : Object.keys(getChatStore(account).getState().conversations);
  logger.info(`[XmtpRN] Syncing ${account}`, {
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
    const {
      newConversations,
      groups,
      newGroups = [],
    } = await loadConversations(account, knownTopics);
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
    await streamGroups(account).catch((e) => {
      onSyncLost(account, e);
    });
    // Streaming all dm messages (not groups because buggy)
    await streamAllMessages(account).catch((e) => {
      onSyncLost(account, e);
    });
    streamingAccounts[account] = true;

    logger.debug("RECALLING syncConversationsMessages / syncGroupsMessages");
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
    currentBackoff = INITIAL_BACKOFF;
    await updateConsentStatus(account);
    logger.info(`[XmtpRN] Finished syncing ${account}`);
  } catch (e) {
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
