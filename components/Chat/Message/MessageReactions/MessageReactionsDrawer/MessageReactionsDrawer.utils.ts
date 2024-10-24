import { createBottomSheetModalRef } from "@design-system/BottomSheet/BottomSheet.utils";

import { useMessageReactionsStore } from "./MessageReactions.store";
import { MessageToDisplay } from "../../Message";

export const bottomSheetModalRef = createBottomSheetModalRef();

export function openMessageReactionsDrawer(message: MessageToDisplay) {
  bottomSheetModalRef.current?.present();
  useMessageReactionsStore.setState({ message });
}

export function closeMessageReactionsDrawer() {
  bottomSheetModalRef.current?.dismiss();
  useMessageReactionsStore.setState({ message: null });
}
