import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";

import logger from "../utils/logger";

export interface AppStateHookSettings {
  onChange?: (status: AppStateStatus) => void;
  onForeground?: () => void;
  onBackground?: () => void;
  deps?: React.DependencyList;
}

type Handler = (state: AppStateStatus) => void;

export const useAppStateHandlers = (settings?: AppStateHookSettings) => {
  const { onChange, onForeground, onBackground, deps = [] } = settings || {};

  const previousAppState = useRef<AppStateStatus | null>(null);
  const listenerRef = useRef<ReturnType<
    typeof AppState.addEventListener
  > | null>(null);

  useEffect(() => {
    const handleAppStateChange: Handler = (nextAppState) => {
      logger.debug(
        `App state changed to ${nextAppState} from ${previousAppState.current}`
      );

      if (nextAppState === "active" && previousAppState.current !== "active") {
        // debugAlertIfMe("onForeground")
        onForeground && onForeground();
      } else if (
        previousAppState.current === "active" &&
        nextAppState.match(/inactive|background/)
      ) {
        // debugAlertIfMe("onBackground")
        onBackground && onBackground();
      }
      onChange && onChange(nextAppState);

      previousAppState.current = nextAppState;
    };

    if (listenerRef.current) {
      listenerRef.current.remove();
    }

    listenerRef.current = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      listenerRef.current && listenerRef.current.remove();
    };
  }, [
    onChange,
    onForeground,
    onBackground,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ...deps,
  ]);
};
