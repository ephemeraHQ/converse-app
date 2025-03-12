import { InboxId } from "@xmtp/react-native-sdk"
import { create } from "zustand"

type StreamingState = {
  isStreamingConversations: boolean
  isStreamingMessages: boolean
  isStreamingConsent: boolean
}

type State = {
  accountStreamingStates: Record<InboxId, StreamingState>
}

type StoreActions = {
  updateStreamingState: (inboxId: InboxId, updates: Partial<StreamingState>) => void
  resetAccount: (inboxId: InboxId) => void
}

export const useStreamingStore = create<State & { actions: StoreActions }>((set) => ({
  accountStreamingStates: {},
  actions: {
    updateStreamingState: (inboxId, updates) =>
      set((state) => ({
        accountStreamingStates: {
          ...state.accountStreamingStates,
          [inboxId]: {
            ...state.accountStreamingStates[inboxId],
            ...updates,
          },
        },
      })),
    resetAccount: (inboxId) =>
      set((state) => {
        const { [inboxId]: _, ...rest } = state.accountStreamingStates
        return { accountStreamingStates: rest }
      }),
  },
}))
