import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";

import {
  getChatStore,
  getSettingsStore,
  useAccountsList,
} from "../data/store/accountsStore";
import { useAppStore } from "../data/store/appStore";
import { getBlockedPeers } from "../utils/api";
import { pick } from "../utils/objects";
import { syncXmtpClient } from "../utils/xmtpRN/client";

export default function XmtpEngine() {
  const appState = useRef(AppState.currentState);
  const accounts = useAccountsList();
  const syncedAccounts = useRef<{ [account: string]: boolean }>({});
  const { hydrationDone, isInternetReachable } = useAppStore((s) =>
    pick(s, ["hydrationDone", "isInternetReachable"])
  );

  const syncAccounts = useCallback((accountsToSync: string[]) => {
    accountsToSync.forEach((a) => {
      const knownTopics = Object.keys(getChatStore(a).getState().conversations);
      const lastSyncedAt = getChatStore(a).getState().lastSyncedAt;
      syncXmtpClient(a, knownTopics, lastSyncedAt);
      syncedAccounts.current[a] = true;
    });
  }, []);

  // Sync accounts on load and when a new one is added
  useEffect(() => {
    if (hydrationDone) {
      const unsyncedAccounts = accounts.filter(
        (a) => !syncedAccounts.current[a]
      );
      syncAccounts(unsyncedAccounts);
      // Sync blocked peers as well
      unsyncedAccounts.map((a) =>
        getBlockedPeers(a).then((addresses) => {
          getSettingsStore(a).getState().setBlockedPeers(addresses);
        })
      );
    }
  }, [accounts, syncAccounts, hydrationDone]);

  // When app back active, resync all, in case we lost sync
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (
          nextAppState === "active" &&
          appState.current.match(/inactive|background/)
        ) {
          syncAccounts(accounts);
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [syncAccounts, accounts]);

  // If lost connection, resync
  const isInternetReachableRef = useRef(isInternetReachable);
  useEffect(() => {
    if (!isInternetReachableRef.current && isInternetReachable) {
      // We're back online!
      syncAccounts(accounts);
    }
    isInternetReachableRef.current = isInternetReachable;
  }, [accounts, isInternetReachable, syncAccounts]);
  return null;
}
