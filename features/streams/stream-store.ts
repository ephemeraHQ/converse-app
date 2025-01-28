import { create } from "zustand";

type StreamingState = {
  isStreamingConversations: boolean;
  isStreamingMessages: boolean;
  isStreamingConsent: boolean;
};

type State = {
  accountStreamingStates: Record<string, StreamingState>;
};

type StoreActions = {
  updateStreamingState: (
    account: string,
    updates: Partial<StreamingState>
  ) => void;
  resetAccount: (account: string) => void;
};

export const useStreamingStore = create<State & { actions: StoreActions }>(
  (set) => ({
    accountStreamingStates: {},
    actions: {
      updateStreamingState: (account, updates) =>
        set((state) => ({
          accountStreamingStates: {
            ...state.accountStreamingStates,
            [account]: {
              ...state.accountStreamingStates[account],
              ...updates,
            },
          },
        })),
      resetAccount: (account) =>
        set((state) => {
          const { [account]: _, ...rest } = state.accountStreamingStates;
          return { accountStreamingStates: rest };
        }),
    },
  })
);
