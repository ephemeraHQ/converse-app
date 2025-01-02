import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";

export type AppStateHookSettings = {
  onChange?: (status: AppStateStatus) => void;
  onForeground?: () => void;
  onBackground?: () => void;
  onInactive?: () => void;
  deps?: React.DependencyList;
};

type Handler = (state: AppStateStatus) => void;

export const useAppStateHandlers = (settings?: AppStateHookSettings) => {
  const {
    onChange,
    onForeground,
    onBackground,
    onInactive,
    deps = [],
  } = settings || {};

  const previousAppState = useRef<AppStateStatus | null>(null);
  const listenerRef = useRef<ReturnType<
    typeof AppState.addEventListener
  > | null>(null);

  useEffect(() => {
    const handleAppStateChange: Handler = (nextAppState) => {
      if (nextAppState === "active" && previousAppState.current !== "active") {
        onForeground && onForeground();
      } else if (
        previousAppState.current === "active" &&
        nextAppState === "background"
      ) {
        onBackground && onBackground();
      } else if (
        previousAppState.current === "active" &&
        nextAppState === "inactive"
      ) {
        onInactive && onInactive();
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
    onInactive,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ...deps,
  ]);
};
