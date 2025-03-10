import { createBottomSheetModalRef } from "@/design-system/BottomSheet/BottomSheet.utils"

export const messageContextMenuEmojiPickerBottomSheetRef = createBottomSheetModalRef()

export function openMessageContextMenuEmojiPicker() {
  messageContextMenuEmojiPickerBottomSheetRef.current?.present()
}

export function closeMessageContextMenuEmojiPicker() {
  messageContextMenuEmojiPickerBottomSheetRef.current?.dismiss()
}
