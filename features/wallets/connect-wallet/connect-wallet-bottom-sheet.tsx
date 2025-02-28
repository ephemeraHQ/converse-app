import React, { useCallback, useMemo, useState } from "react";
import { useDerivedValue, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DynamicPages } from "@/components/dynamic-pages/dynamic-pages";
import { BottomSheetContentContainer } from "@/design-system/BottomSheet/BottomSheetContentContainer";
import { BottomSheetModal } from "@/design-system/BottomSheet/BottomSheetModal";
import { ConnectWalletBottomSheetChooseWallet } from "./connect-wallet-bottom-sheet-choose-wallet";
import { ConnectWalletBottomSheetOnboarding } from "./connect-wallet-bottom-sheet-onboarding";
import { connectWalletBottomSheetRef } from "./connect-wallet-bottom-sheet.service";
import { useConnectWalletStore } from "./connect-wallet.store";
import { IConnectWalletBottomSheetProps } from "./connect-wallet.types";

// URL for Coinbase callback

/**
 * Bottom sheet for connecting wallets and importing identities
 */
export function ConnectWalletBottomSheet(
  {
    // onClose,
    // onWalletImported,
  }: IConnectWalletBottomSheetProps,
) {
  const handleClose = useCallback(() => {
    useConnectWalletStore.getState().reset();
  }, []);

  const insets = useSafeAreaInsets();

  const [bottomSheetHeight, setBottomSheetHeight] = useState(500);

  const indexAV = useSharedValue(0);

  useDerivedValue(() => {
    console.log("indexAV:", indexAV.value);
  });

  const handlePageChange = useCallback(
    ({ pageIndex, pageHeight }: { pageIndex: number; pageHeight?: number }) => {
      console.log("page:", pageIndex, pageHeight);
      setBottomSheetHeight(pageHeight || 500);
    },
    [],
  );

  const pages = useMemo(
    () => [
      <ConnectWalletBottomSheetOnboarding key="onboarding" />,
      <ConnectWalletBottomSheetChooseWallet key="choose-wallet" />,
    ],
    [],
  );

  return (
    <BottomSheetModal
      ref={connectWalletBottomSheetRef}
      enableDynamicSizing
      onClose={handleClose}
      animatedIndex={indexAV}
    >
      <BottomSheetContentContainer
        style={{
          height: bottomSheetHeight + insets.bottom,
        }}
      >
        <DynamicPages onPageChange={handlePageChange} pages={pages} />
      </BottomSheetContentContainer>
    </BottomSheetModal>
  );
}
