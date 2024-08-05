import {
  dropConverseDbConnections,
  reconnectConverseDbConnections,
} from "@data/db/driver";
import logger from "@utils/logger";
import { useCallback, useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";

import { getExistingDataSource } from "../data/db/datasource";
import {
  getAccountsList,
  getChatStore,
  getProfilesStore,
  useAccountsList,
} from "../data/store/accountsStore";
import { useAppStore } from "../data/store/appStore";
import { useSelect } from "../data/store/storeHelpers";
import { getTopicsData } from "../utils/api";
import { loadSavedNotificationMessagesToContext } from "../utils/notifications";
import {
  dropXmtpClientsDbConnections,
  reconnectXmtpClientsDbConnections,
} from "../utils/xmtpRN/client";
import { createPendingConversations } from "../utils/xmtpRN/conversations";
import { sendPendingMessages } from "../utils/xmtpRN/send";
import { syncXmtpClient } from "../utils/xmtpRN/sync";

export default function XmtpEngine() {
  const appState = useRef(AppState.currentState);
  const accounts = useAccountsList();
  const syncedAccounts = useRef<{ [account: string]: boolean }>({});
  const syncingAccounts = useRef<{ [account: string]: boolean }>({});
  const { hydrationDone, isInternetReachable } = useAppStore(
    useSelect(["hydrationDone", "isInternetReachable"])
  );

  const syncAccounts = useCallback((accountsToSync: string[]) => {
    accountsToSync.forEach((a) => {
      if (!syncingAccounts.current[a]) {
        getTopicsData(a).then((topicsData) => {
          getChatStore(a).getState().setTopicsData(topicsData, true);
        });
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
    }
  }, [accounts, hydrationDone, syncAccounts]);

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
          reconnectConverseDbConnections();
          await reconnectXmtpClientsDbConnections();
          loadSavedNotificationMessagesToContext();
          // Refreshing profiles store from mmkv
          // as we could have added data from notification
          accounts.forEach((a) => {
            getProfilesStore(a).getState().refreshFromStorage();
          });
          if (isInternetReachableRef.current) {
            syncAccounts(accounts);
          }
        } else if (
          nextAppState.match(/inactive|background/) &&
          appState.current === "active"
        ) {
          dropConverseDbConnections();
          await dropXmtpClientsDbConnections();
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
    if (
      !useAppStore.getState().splashScreenHidden ||
      AppState.currentState.match(/inactive|background/)
    ) {
      return;
    }
    runningCron.current = true;
    const accounts = getAccountsList();
    for (const account of accounts) {
      if (
        getChatStore(account).getState().localClientConnected &&
        (Platform.OS === "web" || getExistingDataSource(account))
      ) {
        try {
          await createPendingConversations(account);
          await sendPendingMessages(account);
        } catch (e) {
          logger.error(e);
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
