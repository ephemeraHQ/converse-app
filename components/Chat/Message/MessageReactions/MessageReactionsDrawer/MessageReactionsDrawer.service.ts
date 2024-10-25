import { createBottomSheetModalRef } from "@design-system/BottomSheet/BottomSheet.utils";

import { RolledUpReactions } from "../MessageReactions.types";
import {
  resetMessageReactionsStore,
  useMessageReactionsStore,
} from "./MessageReactions.store";

export const bottomSheetModalRef = createBottomSheetModalRef();

export function openMessageReactionsDrawer(
  rolledUpReactions: RolledUpReactions
) {
  try {
    if (!bottomSheetModalRef.current) {
      throw new Error("Modal reference not initialized");
    }
    useMessageReactionsStore.getState().setRolledUpReactions(rolledUpReactions);
    bottomSheetModalRef.current.present();
  } catch (error) {
    console.error("Failed to open message reactions drawer:", error);
    resetMessageReactionsDrawer();
  }
}

export function closeMessageReactionsDrawer(arg?: { resetStore?: boolean }) {
  const { resetStore = true } = arg ?? {};
  bottomSheetModalRef.current?.dismiss();
  if (resetStore) {
    resetMessageReactionsDrawer();
  }
}

export function resetMessageReactionsDrawer() {
  resetMessageReactionsStore();
}

export function useMessageReactionsRolledUpReactions() {
  return useMessageReactionsStore((state) => state.rolledUpReactions);
}
