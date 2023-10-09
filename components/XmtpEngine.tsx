import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";

import { getExistingDataSource } from "../data/db/datasource";
import {
  getAccountsList,
  getChatStore,
  getSettingsStore,
  useAccountsList,
} from "../data/store/accountsStore";
import { useAppStore } from "../data/store/appStore";
import { getBlockedPeers, getDeletedTopics } from "../utils/api";
import { loadSavedNotificationMessagesToContext } from "../utils/notifications";
import { pick } from "../utils/objects";
import { syncXmtpClient } from "../utils/xmtpRN/client";
import { createPendingConversations } from "../utils/xmtpRN/conversations";
import { sendPendingMessages } from "../utils/xmtpRN/send";

export default function XmtpEngine() {
  const appState = useRef(AppState.currentState);
  const accounts = useAccountsList();
  const syncedAccounts = useRef<{ [account: string]: boolean }>({});
  const syncingAccounts = useRef<{ [account: string]: boolean }>({});
  const { hydrationDone, isInternetReachable } = useAppStore((s) =>
    pick(s, ["hydrationDone", "isInternetReachable"])
  );

  const syncAccounts = useCallback((accountsToSync: string[]) => {
    accountsToSync.forEach((a) => {
      if (!syncingAccounts.current[a]) {
        syncedAccounts.current[a] = true;
        syncingAccounts.current[a] = true;
        syncXmtpClient(a)
          .then(() => {
            syncingAccounts.current[a] = false;
          })
          .catch(() => {
            syncingAccounts.current[a] = false;
          });
      }
    });
  }, []);

  // Sync accounts on load and when a new one is added
  useEffect(() => {
    // Let's remove accounts that dont exist anymore from ref
    Object.keys(syncedAccounts.current).forEach((account) => {
      if (!accounts.includes(account)) {
        delete syncedAccounts.current[account];
      }
    });
    if (hydrationDone) {
      const unsyncedAccounts = accounts.filter(
        (a) => !syncedAccounts.current[a]
      );
      syncAccounts(unsyncedAccounts);
      // Sync blocked peers
      unsyncedAccounts.map((a) =>
        getBlockedPeers(a).then((addresses) => {
          getSettingsStore(a).getState().setBlockedPeers(addresses);
        })
      );
      // Sync deleted topics
      unsyncedAccounts.map((a) =>
        getDeletedTopics(a).then((topics) => {
          getChatStore(a).getState().markTopicsAsDeleted(topics);
        })
      );
    }
  }, [accounts, syncAccounts, hydrationDone]);

  const isInternetReachableRef = useRef(isInternetReachable);

  // When app back active, resync all, in case we lost sync
  // And also save data from notifications
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (
          nextAppState === "active" &&
          appState.current.match(/inactive|background/) &&
          hydrationDone
        ) {
          loadSavedNotificationMessagesToContext();
          if (isInternetReachableRef.current) {
            syncAccounts(accounts);
          }
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [syncAccounts, accounts, hydrationDone]);

  // If lost connection, resync
  useEffect(() => {
    if (
      !isInternetReachableRef.current &&
      isInternetReachable &&
      hydrationDone
    ) {
      // We're back online!
      syncAccounts(accounts);
    }
    isInternetReachableRef.current = isInternetReachable;
  }, [accounts, hydrationDone, isInternetReachable, syncAccounts]);

  // Cron

  const lastCronTimestamp = useRef(0);
  const runningCron = useRef(false);

  const xmtpCron = useCallback(async () => {
    if (!useAppStore.getState().splashScreenHidden) {
      return;
    }
    runningCron.current = true;
    const accounts = getAccountsList();
    for (const account of accounts) {
      if (
        getChatStore(account).getState().localClientConnected &&
        getExistingDataSource(account)
      ) {
        try {
          await createPendingConversations(account);
          await sendPendingMessages(account);
        } catch (e) {
          console.log(e);
        }
      }
    }
    lastCronTimestamp.current = new Date().getTime();
    runningCron.current = false;
  }, []);

  useEffect(() => {
    // Launch cron
    const interval = setInterval(() => {
      if (runningCron.current) return;
      const now = new Date().getTime();
      if (now - lastCronTimestamp.current > 1000) {
        xmtpCron();
      }
    }, 300);

    return () => clearInterval(interval);
  }, [xmtpCron]);

  return null;
}
