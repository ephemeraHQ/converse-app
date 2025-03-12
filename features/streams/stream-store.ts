import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { create } from "zustand"

type StreamingState = {
  isStreamingConversations: boolean
  isStreamingMessages: boolean
  isStreamingConsent: boolean
}

type State = {
  accountStreamingStates: Record<IXmtpInboxId, StreamingState>
}

type StoreActions = {
  updateStreamingState: (inboxId: IXmtpInboxId, updates: Partial<StreamingState>) => void
  resetAccount: (inboxId: IXmtpInboxId) => void
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
