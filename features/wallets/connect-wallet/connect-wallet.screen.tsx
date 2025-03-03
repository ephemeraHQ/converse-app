import React, { useCallback, useEffect, useMemo } from "react"
import { LayoutChangeEvent, useWindowDimensions } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useActiveWallet } from "thirdweb/react"
import { DynamicPages } from "@/components/dynamic-pages/dynamic-pages"
import { Screen } from "@/components/screen/screen"
import { Snackbars } from "@/components/snackbar/snackbars"
import { VStack } from "@/design-system/VStack"
import { ConnectWalletChooseApp } from "@/features/wallets/connect-wallet/components/connect-wallet-choose-app"
import { useRouter } from "@/navigation/use-navigation"
import { useAppTheme } from "@/theme/use-app-theme"
import { captureError } from "@/utils/capture-error"
import { GenericError } from "@/utils/error"
import { ConnectWalletBottomSheetOnboarding } from "./connect-wallet-onboarding"
import {
  disconnectActiveWallet,
  resetConnectWalletStore,
} from "./connect-wallet.service"
import { useConnectWalletStore } from "./connect-wallet.store"

export function ConnectWalletBottomSheetScreen() {
  const { theme } = useAppTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const windowHeight = useWindowDimensions().height

  // Sync ThirdWeb wallet state with our store
  useSyncThirdwebWallet()

  // Set up the pages for the dynamic pages component
  const pages = useMemo(
    () => [
      <ConnectWalletBottomSheetOnboarding key="onboarding" />,
      <ConnectWalletChooseApp key="choose-wallet" />,
    ],
    [],
  )

  // Handle layout changes to adjust the bottom sheet height
  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const contentHeight = event.nativeEvent.layout.height
      const height =
        contentHeight +
        insets.bottom +
        // Extra spacing to prevent content from being too close to the bottom
        theme.spacing.xxl
      const detent = height / windowHeight
      router.setOptions({
        sheetAllowedDetents: [detent],
      })
    },
    [insets.bottom, router, windowHeight, theme],
  )

  // Clean up when the component unmounts
  useEffect(() => {
    return () => {
      disconnectActiveWallet().catch((error) => {
        captureError(
          new GenericError({
            error,
            additionalMessage: `Failed to disconnect wallet`,
          }),
        )
      })
      resetConnectWalletStore()
    }
  }, [])

  return (
    <>
      <Screen backgroundColor={theme.colors.background.raised}>
        <VStack onLayout={handleLayout}>
          <DynamicPages pages={pages} />
        </VStack>
      </Screen>
      {/* Not sure why but if not here, they appear behind the screen? (formSheet problem?) */}
      <Snackbars />
    </>
  )
}

/**
 * Hook to synchronize ThirdWeb wallet state with our store
 * Disconnects ThirdWeb wallet if we don't have a corresponding wallet in our store
 */
function useSyncThirdwebWallet() {
  const activeWallet = useActiveWallet()
  const thirdwebWalletIdThatIsConnecting = useConnectWalletStore(
    (state) => state.thirdwebWalletIdThatIsConnecting,
  )

  useEffect(() => {
    if (!thirdwebWalletIdThatIsConnecting && activeWallet) {
      disconnectActiveWallet()
    }
  }, [activeWallet, thirdwebWalletIdThatIsConnecting])
}
