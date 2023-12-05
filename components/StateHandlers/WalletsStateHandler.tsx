import { useEffect, useRef } from "react";
import { AppState } from "react-native";

import { refreshBalanceForAccounts } from "../../utils/wallet";

export default function WalletsStateHandler() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Things to do when app opens
    refreshBalanceForAccounts();
  }, []);

  useEffect(() => {
    // Things to do when app status changes (does NOT include first load)
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (
          nextAppState === "active" &&
          appState.current.match(/inactive|background/)
        ) {
          refreshBalanceForAccounts();
        } else {
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return null;
}
