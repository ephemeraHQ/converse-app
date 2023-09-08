import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";

import { getChatStore, useAccountsList } from "../data/store/accountsStore";
import { useAppStore } from "../data/store/appStore";
import { syncXmtpClient } from "../utils/xmtpRN/client";

export default function XmtpEngine() {
  const appState = useRef(AppState.currentState);
  const accounts = useAccountsList();
  const syncedAccounts = useRef<{ [account: string]: boolean }>({});
  const hydrationDone = useAppStore((s) => s.hydrationDone);

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

  return null;
}
