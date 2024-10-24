import logger from "@utils/logger";
import { retryWithBackoff } from "@utils/retryWithBackoff";
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
import { getChatStore } from "../../data/store/accountsStore";
import { loadXmtpKey } from "../keychain/helpers";

const instantiatingClientForAccount: {
  [account: string]: Promise<ConverseXmtpClientType | Client> | undefined;
} = {};

export const getXmtpClient = async (
  account: string
): Promise<ConverseXmtpClientType | Client> => {
  logger.debug("[XmtpSync] Getting XMTP client", { account });

  if (account && xmtpClientByAccount[account]) {
    logger.debug("[XmtpSync] Returning existing client", { account });
    return xmtpClientByAccount[account];
  }

  const alreadyInstantiating = instantiatingClientForAccount[account];
  if (alreadyInstantiating) {
    logger.debug("[XmtpSync] Client already being instantiated", { account });
    return alreadyInstantiating;
  }

  if (Object.keys(instantiatingClientForAccount).length > 0) {
    logger.debug(
      "[XmtpSync] ⏰ Other client instantiation in progress, waiting",
      {
        pendingAccounts: Object.keys(instantiatingClientForAccount),
      }
    );
    // ⏰ Wait for other client initialization
    await new Promise((r) => setTimeout(r, 200));
    return getXmtpClient(account);
  }

  logger.info("[XmtpSync] Starting new client instantiation", { account });
  instantiatingClientForAccount[account] = (async () => {
    try {
      logger.debug("[XmtpSync] Loading base64 key", { account });
      const base64Key = await loadXmtpKey(account);

      if (base64Key) {
        logger.debug("[XmtpSync] Getting client from base64 key", { account });
        const client = await getXmtpClientFromBase64Key(base64Key);
        logger.info("[XmtpSync] Client instantiated successfully", {
          account,
          clientAddress: client.address,
        });

        getChatStore(account).getState().setLocalClientConnected(true);
        getChatStore(account).getState().setErrored(false);
        xmtpClientByAccount[client.address] = client;
        return client;
      } else {
        logger.error("[XmtpSync] No client key found", { account });
        throw new Error(`[XmtpSync] No client found for ${account}`);
      }
    } catch (e: any) {
      logger.error("[XmtpSync] Client instantiation failed", {
        account,
        error: e.message,
        stack: e.stack,
      });
      getChatStore(account).getState().setErrored(true);
      throw e;
    } finally {
      logger.debug("[XmtpSync] Cleaning up instantiation state", { account });
      delete instantiatingClientForAccount[account];
    }
  })();
  return instantiatingClientForAccount[account] as Promise<
    ConverseXmtpClientType | Client
  >;
};

export const onSyncLost = async (account: string, error: any) => {
  logger.warn("[XmtpSync] Sync lost", {
    account,
    error: error?.message,
    appState: AppState.currentState,
  });

  getChatStore(account).getState().setReconnecting(true);

  if (
    `${error}`.includes("storage error: Pool needs to  reconnect before use")
  ) {
    if (AppState.currentState === "active") {
      logger.info("[XmtpSync] Attempting database reconnection", { account });
      await reconnectXmtpClientsDbConnections();
      logger.debug("[XmtpSync] Database reconnection complete", { account });
    } else if (AppState.currentState === "background") {
      logger.debug("[XmtpSync] Ignoring reconnection in background state", {
        account,
      });
    } else {
      logger.error("[XmtpSync] Sync error in unknown app state", {
        account,
        error: error?.message,
        appState: AppState.currentState,
      });
    }
  } else {
    logger.error("[XmtpSync] Unexpected sync error", {
      account,
      error: error?.message,
      stack: error?.stack,
    });
  }
};

const streamingAccounts: { [account: string]: boolean } = {};

const syncClient = async (account: string) => {
  logger.info("[XmtpSync] ⏰ Starting client sync", { account });

  // ⏰ Get last sync timestamp
  const lastSyncedAt = getChatStore(account).getState().lastSyncedAt || 0;
  const _lastSyncedTopics =
    getChatStore(account).getState().lastSyncedTopics || [];

  const lastSyncedTopics = intersect([
    _lastSyncedTopics,
    Object.keys(getChatStore(account).getState().conversations),
  ]);

  const knownTopics =
    lastSyncedTopics.length > 0
      ? lastSyncedTopics
      : Object.keys(getChatStore(account).getState().conversations);

  logger.debug("[XmtpSync] Sync parameters", {
    account,
    lastSyncedAt,
    topicCount: knownTopics.length,
  });

  const queryConversationsFromTimestamp: { [topic: string]: number } = {};
  const queryGroupsFromTimestamp: { [topic: string]: number } = {};

  // Sort conversations and groups
  knownTopics.forEach((topic) => {
    if (getChatStore(account).getState().conversations[topic]?.isGroup) {
      queryGroupsFromTimestamp[topic] = lastSyncedAt;
    } else {
      queryConversationsFromTimestamp[topic] = lastSyncedAt;
    }
  });

  // ⏰ Current timestamp for sync
  const now = new Date().getTime();

  logger.debug("[XmtpSync] ⏰ Loading conversations", {
    account,
    knownTopicsCount: knownTopics.length,
  });

  const {
    newConversations,
    groups,
    newGroups = [],
  } = await loadConversations(account, knownTopics);

  logger.debug("[XmtpSync] Conversations loaded", {
    account,
    newConversationsCount: newConversations.length,
    groupsCount: groups.length,
    newGroupsCount: newGroups.length,
  });

  // ⏰ Update timestamps for new conversations and groups
  newConversations.forEach((c) => {
    queryConversationsFromTimestamp[c.topic] = 0;
  });
  newGroups.forEach((g) => {
    queryGroupsFromTimestamp[g.topic] = 0;
  });

  getChatStore(account).getState().setReconnecting(false);

  // Start streaming with detailed logging
  logger.info("[XmtpSync] Starting message streams", { account });

  try {
    await Promise.all([
      streamConversations(account),
      streamGroups(account),
      streamAllMessages(account),
    ]);
    streamingAccounts[account] = true;
    logger.debug("[XmtpSync] All streams started successfully", { account });
  } catch (error: unknown) {
    logger.error("[XmtpSync] Stream initialization failed", {
      account,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Sync messages
  logger.debug("[XmtpSync] ⏰ Starting message sync", { account });
  const [fetchedMessagesCount, fetchedGroupMessagesCount] = await Promise.all([
    syncConversationsMessages(account, queryConversationsFromTimestamp),
    syncGroupsMessages(account, groups, queryGroupsFromTimestamp),
  ]);

  logger.info("[XmtpSync] Message sync complete", {
    account,
    fetchedMessagesCount,
    fetchedGroupMessagesCount,
  });

  // Update spam scores if needed
  if (!getChatStore(account).getState().initialLoadDone) {
    logger.debug("[XmtpSync] Refreshing spam scores", { account });
    await refreshAllSpamScores(account);
  }

  // Finalize sync
  getChatStore(account).getState().setInitialLoadDone();

  if (fetchedMessagesCount > 0 || fetchedGroupMessagesCount > 0) {
    const conversationTopicsToQuery = Object.keys(
      queryConversationsFromTimestamp
    );
    const groupTopicsToQuery = Object.keys(queryGroupsFromTimestamp);

    logger.debug("[XmtpSync] ⏰ Updating last synced state", {
      account,
      topicsCount: conversationTopicsToQuery.length + groupTopicsToQuery.length,
    });

    getChatStore(account)
      .getState()
      .setLastSyncedAt(now, [
        ...conversationTopicsToQuery,
        ...groupTopicsToQuery,
      ]);
  }

  await updateConsentStatus(account);
  logger.info("[XmtpSync] Sync completed successfully", { account });
};

export const syncXmtpClient = async (account: string) => {
  logger.info("[XmtpSync] ⏰ Initiating client sync with retry", { account });

  return retryWithBackoff({
    fn: () => syncClient(account),
    retries: 5,
    // ⏰ Retry timing configuration
    delay: 1000,
    factor: 2,
    maxDelay: 30000,
    context: `⏰ syncing ${account}`,
    onError: async (e: unknown) => {
      logger.error("[XmtpSync] ⏰ Sync attempt failed", {
        account,
        error: e instanceof Error ? e.message : String(e),
        retryCount: 5,
      });
      await onSyncLost(account, e);
    },
  });
};

export const deleteXmtpClient = async (account: string) => {
  logger.info("[XmtpSync] Deleting XMTP client", { account });

  if (account in xmtpClientByAccount) {
    logger.debug("[XmtpSync] Stopping message streams", { account });
    stopStreamingAllMessage(account);
    stopStreamingConversations(account);
    stopStreamingGroups(account);
  }

  logger.debug("[XmtpSync] Cleaning up client state", { account });
  delete xmtpClientByAccount[account];
  deleteOpenedConversations(account);
  delete xmtpSignatureByAccount[account];
  delete instantiatingClientForAccount[account];
  delete streamingAccounts[account];

  logger.info("[XmtpSync] Client deletion complete", { account });
};
