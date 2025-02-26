import { focusManager } from "@tanstack/react-query";
import { AppState, AppStateStatus } from "react-native";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { logger } from "@/utils/logger";

type State = {
  currentState: AppStateStatus;
  previousState: AppStateStatus | null;
};

type Actions = {
  handleAppStateChange: (nextAppState: AppStateStatus) => void;
};

export const useAppState = create<State & { actions: Actions }>()(
  subscribeWithSelector((set) => ({
    currentState: AppState.currentState,
    previousState: null,

    actions: {
      handleAppStateChange: (nextAppState) =>
        set((state) => {
          return {
            previousState: state.currentState,
            currentState: nextAppState,
          };
        }),
    },
  })),
);

// Subscribe to state changes
useAppState.subscribe(
  (state) => state.currentState,
  (currentState, previousState) => {
    logger.debug("App state changed", {
      from: previousState,
      to: currentState,
    });
  },
);

// Set up app state listener
AppState.addEventListener("change", (nextAppState) => {
  focusManager.setFocused(nextAppState === "active");
  useAppState.getState().actions.handleAppStateChange(nextAppState);
});
