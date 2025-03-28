import { createBottomSheetModalRef } from "@/design-system/BottomSheet/BottomSheet.utils"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { useGroupMemberDetailsBottomSheetStore } from "./group-member-details.store"

export const groupMemberDetailsBottomSheetRef = createBottomSheetModalRef()

export function openGroupMemberDetailsBottomSheet(memberInboxId: IXmtpInboxId) {
  useGroupMemberDetailsBottomSheetStore.getState().actions.setMemberInboxId(memberInboxId)
  groupMemberDetailsBottomSheetRef.current?.present()
}

export function closeGroupMemberDetailsBottomSheet() {
  groupMemberDetailsBottomSheetRef.current?.dismiss()
}
