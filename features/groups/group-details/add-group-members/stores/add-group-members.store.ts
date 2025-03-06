import { InboxId } from "@xmtp/react-native-sdk"
import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"

type IAddGroupMembersState = {
  searchQuery: string
  selectedInboxIds: InboxId[]
}

type IAddGroupMembersActions = {
  setSearchQuery: (query: string) => void
  setSelectedInboxIds: (inboxIds: InboxId[]) => void
  addSelectedInboxId: (inboxId: InboxId) => void
  reset: () => void
}

type IAddGroupMembersStore = IAddGroupMembersState & {
  actions: IAddGroupMembersActions
}

const initialState: IAddGroupMembersState = {
  searchQuery: "",
  selectedInboxIds: [],
}

export const useAddGroupMembersStore = create<IAddGroupMembersStore>()(
  subscribeWithSelector((set) => ({
    ...initialState,
    actions: {
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedInboxIds: (inboxIds) => set({ selectedInboxIds: inboxIds }),
      addSelectedInboxId: (inboxId) =>
        set((state) => ({
          searchQuery: "", // Better UX to clear the search query when adding a user
          selectedInboxIds: [...state.selectedInboxIds, inboxId],
        })),
      reset: () => set({ ...initialState }),
    },
  })),
)
