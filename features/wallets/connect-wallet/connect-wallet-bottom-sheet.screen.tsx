import React, { useCallback, useEffect, useMemo } from "react";
import { LayoutChangeEvent, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DynamicPages } from "@/components/dynamic-pages/dynamic-pages";
import { Screen } from "@/components/screen/screen";
import { VStack } from "@/design-system/VStack";
import { useConnectWalletStore } from "@/features/wallets/connect-wallet/connect-wallet.store";
import { useRouter } from "@/navigation/use-navigation";
import { useAppTheme } from "@/theme/use-app-theme";
import { ConnectWalletBottomSheetChooseWallet } from "./connect-wallet-bottom-sheet-choose-wallet";
import { ConnectWalletBottomSheetOnboarding } from "./connect-wallet-bottom-sheet-onboarding";

export function ConnectWalletBottomSheetScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const windowHeight = useWindowDimensions().height;

  const pages = useMemo(
    () => [
      <ConnectWalletBottomSheetOnboarding key="onboarding" />,
      <ConnectWalletBottomSheetChooseWallet key="choose-wallet" />,
    ],
    [],
  );

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const contentHeight = event.nativeEvent.layout.height;
      const height =
        contentHeight +
        insets.bottom +
        // Not sure why we need to add this extra spacing but otherwise it was too close to the bottom of the screen
        theme.spacing.lg;
      const detent = height / windowHeight;
      console.log("detent:", detent);
      router.setOptions({
        sheetAllowedDetents: [detent],
      });
    },
    [insets.bottom, router, windowHeight, theme],
  );

  useEffect(() => {
    return () => {
      useConnectWalletStore.getState().actions.reset();
    };
  }, []);

  return (
    <Screen backgroundColor={theme.colors.background.raised}>
      <VStack onLayout={handleLayout}>
        <DynamicPages pages={pages} />
      </VStack>
    </Screen>
  );
}
