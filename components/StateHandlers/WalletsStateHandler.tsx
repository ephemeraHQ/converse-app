import { useEffect, useRef } from "react";
import { AppState } from "react-native";

import { usePrivySigner } from "../../utils/evm/helpers";
import { refreshBalanceForAccounts } from "../../utils/wallet";

export default function WalletsStateHandler() {
  const appState = useRef(AppState.currentState);
  const privySigner = usePrivySigner();

  useEffect(() => {
    // Things to do when app opens
    refreshBalanceForAccounts(privySigner);
  }, [privySigner]);

  useEffect(() => {
    // Things to do when app status changes (does NOT include first load)
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (
          nextAppState === "active" &&
          appState.current.match(/inactive|background/)
        ) {
          refreshBalanceForAccounts(privySigner);
        } else {
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [privySigner]);

  return null;
}
