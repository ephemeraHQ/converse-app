import { createBottomSheetModalRef } from "@/design-system/BottomSheet/BottomSheet.utils";

export const connectWalletBottomSheetRef = createBottomSheetModalRef();

export function openConnectWalletBottomSheet() {
  connectWalletBottomSheetRef.current?.present();
}

export function closeConnectWalletBottomSheet() {
  connectWalletBottomSheetRef.current?.dismiss();
}
