import { create } from "zustand"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"

type IGroupMemberDetailsBottomSheetState = {
  memberInboxId: IXmtpInboxId | undefined
}

type IGroupMemberDetailsBottomSheetActions = {
  setMemberInboxId: (memberInboxId: IXmtpInboxId) => void
  reset: () => void
}

type IGroupMemberDetailsBottomSheetStore = IGroupMemberDetailsBottomSheetState & {
  actions: IGroupMemberDetailsBottomSheetActions
}

const initialState: IGroupMemberDetailsBottomSheetState = {
  memberInboxId: undefined,
}

export const useGroupMemberDetailsBottomSheetStore = create<IGroupMemberDetailsBottomSheetStore>(
  (set, get) => ({
    ...initialState,
    actions: {
      setMemberInboxId: (memberInboxId) => set({ memberInboxId }),
      reset: () => set(initialState),
    },
  }),
)
