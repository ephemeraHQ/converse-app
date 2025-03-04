import { create } from "zustand"

export type IConversationMessageContextMenuEmojiPickerStore = {
  isEmojiPickerOpen: boolean
  setIsEmojiPickerOpen: (isEmojiPickerOpen: boolean) => void
}

export const useConversationMessageContextMenuEmojiPickerStore =
  create<IConversationMessageContextMenuEmojiPickerStore>((set, get) => ({
    isEmojiPickerOpen: false,
    setIsEmojiPickerOpen: (isEmojiPickerOpen) => set({ isEmojiPickerOpen }),
  }))
