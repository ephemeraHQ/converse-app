import { createBottomSheetModalRef } from "@design-system/BottomSheet/BottomSheet.utils";

import { RolledUpReactions } from "../MessageReactions.types";
import {
  initialMessageReactionsState,
  useMessageReactionsStore,
} from "./MessageReactions.store";

export const bottomSheetModalRef = createBottomSheetModalRef();

export function openMessageReactionsDrawer(
  rolledUpReactions: RolledUpReactions
) {
  bottomSheetModalRef.current?.present();
  useMessageReactionsStore.setState({ rolledUpReactions });
}

export function closeMessageReactionsDrawer(arg?: { resetStore?: boolean }) {
  const { resetStore = true } = arg ?? {};
  bottomSheetModalRef.current?.dismiss();
  if (resetStore) {
    resetMessageReactionsDrawer();
  }
}

export function resetMessageReactionsDrawer() {
  useMessageReactionsStore.setState(initialMessageReactionsState);
}

export function useMessageReactionsRolledUpReactions() {
  return useMessageReactionsStore((state) => state.rolledUpReactions);
}
