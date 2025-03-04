import { InboxId } from "@xmtp/react-native-sdk"
import { create } from "zustand"

type IConversationCreateSearchInputStore = {
  selectedChipInboxId: InboxId | null
  actions: {
    setSelectedChipInboxId: (inboxId: InboxId | null) => void
  }
}

export const useConversationCreateSearchInputStore = create<IConversationCreateSearchInputStore>(
  (set, get) => ({
    selectedChipInboxId: null,
    actions: {
      setSelectedChipInboxId: (inboxId) => set({ selectedChipInboxId: inboxId }),
    },
  }),
)
