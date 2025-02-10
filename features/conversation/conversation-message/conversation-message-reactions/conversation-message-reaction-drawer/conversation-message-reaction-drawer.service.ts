import { MessageId } from "@xmtp/react-native-sdk";
import {
  resetMessageReactionsStore,
  useMessageReactionsStore,
} from "./conversation-message-reaction-drawer.store";
import { createBottomSheetModalRef } from "@/design-system/BottomSheet/BottomSheet.utils";

export const conversationMessageDrawerBottomSheetRef =
  createBottomSheetModalRef();

export function openMessageReactionsDrawer(args: { messageId: MessageId }) {
  const { messageId } = args;
  const store = useMessageReactionsStore.getState();
  store.actions.setMessageId(messageId);
}

export function closeMessageReactionsDrawer() {
  conversationMessageDrawerBottomSheetRef.current?.close();
  resetMessageReactionsStore();
}
