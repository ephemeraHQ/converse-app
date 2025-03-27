import { createBottomSheetModalRef } from "@/design-system/BottomSheet/BottomSheet.utils"
import { IXmtpMessageId } from "@/features/xmtp/xmtp.types"
import {
  resetMessageReactionsStore,
  useMessageReactionsStore,
} from "./conversation-message-reaction-drawer.store"

export const conversationMessageDrawerBottomSheetRef = createBottomSheetModalRef()

export function openMessageReactionsDrawer(args: { messageId: IXmtpMessageId }) {
  const { messageId } = args
  const store = useMessageReactionsStore.getState()
  store.actions.setMessageId(messageId)
}

export function closeMessageReactionsDrawer() {
  conversationMessageDrawerBottomSheetRef.current?.close()
  resetMessageReactionsStore()
}
