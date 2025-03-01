import React, { useCallback, useEffect, useMemo } from "react"
import { LayoutChangeEvent, useWindowDimensions } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useActiveWallet } from "thirdweb/react"
import { DynamicPages } from "@/components/dynamic-pages/dynamic-pages"
import { Screen } from "@/components/screen/screen"
import { VStack } from "@/design-system/VStack"
import { useRouter } from "@/navigation/use-navigation"
import { useAppTheme } from "@/theme/use-app-theme"
import { ConnectWalletChooseApp } from "./connect-wallet-choose-app"
import { ConnectWalletBottomSheetOnboarding } from "./connect-wallet-onboarding"
import {
  disconnectConnectingWallet,
  disconnectWallet,
} from "./connect-wallet.service"
import { useConnectWalletStore } from "./connect-wallet.store"

/**
 * Screen component for the wallet connection bottom sheet
 *
 * This screen manages the dynamic pages for wallet connection flow
 * and handles cleanup when the screen is unmounted.
 */
export function ConnectWalletBottomSheetScreen() {
  const { theme } = useAppTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const windowHeight = useWindowDimensions().height

  // Get active wallet from ThirdWeb and our store
  const activeWallet = useActiveWallet()
  const thirdwebWalletIdThatIsConnecting = useConnectWalletStore(
    (state) => state.thirdwebWalletIdThatIsConnecting,
  )

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

  // Disconnect ThirdWeb wallet if we don't have one in our store
  useEffect(() => {
    if (!thirdwebWalletIdThatIsConnecting && activeWallet) {
      disconnectWallet()
    }
  }, [activeWallet, thirdwebWalletIdThatIsConnecting])

  // Clean up when the component unmounts
  useEffect(() => {
    return () => {
      disconnectConnectingWallet()
    }
  }, [])

  return (
    <Screen backgroundColor={theme.colors.background.raised}>
      <VStack onLayout={handleLayout}>
        <DynamicPages pages={pages} />
      </VStack>
    </Screen>
  )
}
