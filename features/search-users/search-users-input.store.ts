import { create } from "zustand"

type ISearchUsersInputStore = {
  selectedChipInboxId: string | null
  actions: {
    setSelectedChipInboxId: (inboxId: string | null) => void
  }
}

export const useSearchUsersInputStore = create<ISearchUsersInputStore>((set) => ({
  selectedChipInboxId: null,
  actions: {
    setSelectedChipInboxId: (inboxId) => set({ selectedChipInboxId: inboxId }),
  },
}))
