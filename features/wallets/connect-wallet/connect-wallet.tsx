import React, { useCallback, useEffect, useMemo } from "react"
import { LayoutChangeEvent, useWindowDimensions } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { DynamicPages } from "@/components/dynamic-pages/dynamic-pages"
import { Screen } from "@/components/screen/screen"
import { VStack } from "@/design-system/VStack"
import { ConnectWalletChooseApp } from "@/features/wallets/connect-wallet/components/connect-wallet-choose-app"
import { ConnectWalletContextProvider } from "@/features/wallets/connect-wallet/connect-wallet.context"
import { useRouter } from "@/navigation/use-navigation"
import { useAppTheme } from "@/theme/use-app-theme"
import { captureError } from "@/utils/capture-error"
import { GenericError } from "@/utils/error"
import { ConnectWalletOnboarding } from "./components/connect-wallet-onboarding"
import { disconnectActiveWallet, resetConnectWalletStore } from "./connect-wallet.service"

export function ConnectWallet(props: {
  onSelectInfo: (info: { name: string; avatar: string | undefined }) => void
}) {
  const { onSelectInfo } = props

  const { theme } = useAppTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const windowHeight = useWindowDimensions().height

  // Set up the pages for the dynamic pages component
  const pages = useMemo(
    () => [
      <ConnectWalletOnboarding key="onboarding" />,
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
    <ConnectWalletContextProvider onSelectInfo={onSelectInfo}>
      <Screen backgroundColor={theme.colors.background.raised}>
        <VStack onLayout={handleLayout}>
          <DynamicPages pages={pages} />
        </VStack>
      </Screen>
    </ConnectWalletContextProvider>
  )
}
