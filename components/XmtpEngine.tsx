import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";

import { getChatStore, useAccountsList } from "../data/store/accountsStore";
import { syncXmtpClient } from "../utils/xmtpRN/client";

export default function XmtpEngine() {
  const appState = useRef(AppState.currentState);
  const accounts = useAccountsList();

  const syncAccounts = useCallback(() => {
    accounts.forEach((a) => {
      const knownTopics = Object.keys(getChatStore(a).getState().conversations);
      const lastSyncedAt = getChatStore(a).getState().lastSyncedAt;
      syncXmtpClient(a, knownTopics, lastSyncedAt);
    });
  }, [accounts]);

  // On load, we launch the initial sync
  useEffect(syncAccounts, [syncAccounts]);

  // When app back active, resync
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (
          nextAppState === "active" &&
          appState.current.match(/inactive|background/)
        ) {
          syncAccounts();
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [syncAccounts]);

  return null;
}
