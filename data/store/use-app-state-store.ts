import { create } from "zustand";
import { AppState, AppStateStatus } from "react-native";
import logger from "@utils/logger";

type State = {
  currentState: AppStateStatus;
  previousState: AppStateStatus | null;
};

type Actions = {
  handleAppStateChange: (nextAppState: AppStateStatus) => void;
};

export const useAppState = create<State & { actions: Actions }>((set) => ({
  currentState: AppState.currentState,
  previousState: null,

  actions: {
    handleAppStateChange: (nextAppState) =>
      set((state) => {
        logger.debug(
          `App state changing from ${state.currentState} to ${nextAppState}`
        );
        return {
          previousState: state.currentState,
          currentState: nextAppState,
        };
      }),
  },
}));

// Set up app state listener
AppState.addEventListener("change", (nextAppState) => {
  useAppState.getState().actions.handleAppStateChange(nextAppState);
});
