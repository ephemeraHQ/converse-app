import { create } from "zustand"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"

type ISearchUsersInputStore = {
  selectedChipInboxId: IXmtpInboxId | null
  actions: {
    setSelectedChipInboxId: (inboxId: IXmtpInboxId | null) => void
  }
}

export const useSearchUsersInputStore = create<ISearchUsersInputStore>((set) => ({
  selectedChipInboxId: null,
  actions: {
    setSelectedChipInboxId: (inboxId) => set({ selectedChipInboxId: inboxId }),
  },
}))
