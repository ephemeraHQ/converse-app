import { BottomSheetModalProvider } from "@design-system/BottomSheet/BottomSheetModalProvider"
import { useReactQueryDevTools } from "@dev-plugins/react-query"
import { ActionSheetProvider } from "@expo/react-native-action-sheet"
import { Chain, PrivyProvider } from "@privy-io/expo"
import { SmartWalletsProvider } from "@privy-io/expo/smart-wallets"
import { QueryClientProvider } from "@tanstack/react-query"
import { ActionSheet } from "@/components/action-sheet"
import { DebugProvider } from "@/components/debug-provider"
import { Snackbars } from "@/components/snackbar/snackbars"
import { useSetupStreamingSubscriptions } from "@/features/streams/streams"
import { useCoinbaseWalletListener } from "@/features/wallets/utils/coinbase-wallet"
import { $globalStyles } from "@/theme/styles"
import { useThemeProvider } from "@/theme/use-app-theme"
import { useCachedResources } from "@/utils/cache-resources"
import { reactQueryClient } from "@/utils/react-query/react-query-client"
import "expo-dev-client"
import React, { useEffect } from "react"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { KeyboardProvider } from "react-native-keyboard-controller"
import { ThirdwebProvider } from "thirdweb/react"
import { base } from "viem/chains"
import { config } from "./config"
import { useMonitorNetworkConnectivity } from "./dependencies/NetworkMonitor/use-monitor-network-connectivity"
import { AppNavigator } from "./navigation/app-navigator"
import "./utils/ignore-logs"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { sentryInit } from "./utils/sentry"
import { preventSplashScreenAutoHide } from "./utils/splash/splash"

preventSplashScreenAutoHide()
sentryInit()

const baseMainnetOverride: Chain = {
  ...base,
  rpcUrls: {
    ...base.rpcUrls,
    default: {
      http: [config.evm.rpcEndpoint],
    },
  },
}

// For now let's just be on mainnet. Easier to debug
const supportedChains = [baseMainnetOverride] as [Chain, ...Chain[]]

export function App() {
  useMonitorNetworkConnectivity()
  useReactQueryDevTools(reactQueryClient)
  useSetupStreamingSubscriptions()
  useCachedResources()
  useCoinbaseWalletListener()

  const { themeScheme, setThemeContextOverride, ThemeProvider } = useThemeProvider()

  useEffect(() => {
    // Disabled for now until we go live and it works with bun
    // setupAppAttest();
  }, [])

  return (
    // <PersistQueryClientProvider
    //   client={queryClient}
    //   persistOptions={{
    //     persister: reactQueryPersister,
    //     maxAge: DEFAULT_GC_TIME,
    //   }}
    // >
    <QueryClientProvider client={reactQueryClient}>
      <PrivyProvider
        appId={config.privy.appId}
        clientId={config.privy.clientId}
        supportedChains={supportedChains}
      >
        <SmartWalletsProvider>
          <ThirdwebProvider>
            <SafeAreaProvider>
              <KeyboardProvider>
                <ActionSheetProvider>
                  <ThemeProvider value={{ themeScheme, setThemeContextOverride }}>
                    <GestureHandlerRootView style={$globalStyles.flex1}>
                      <DebugProvider>
                        <BottomSheetModalProvider>
                          {/* <AuthenticateWithPasskeyProvider> */}
                          <AppNavigator />
                          {/* </AuthenticateWithPasskeyProvider> */}
                          {/* {__DEV__ && <DevToolsBubble />} */}
                          <Snackbars />
                          <ActionSheet />
                        </BottomSheetModalProvider>
                      </DebugProvider>
                    </GestureHandlerRootView>
                  </ThemeProvider>
                </ActionSheetProvider>
              </KeyboardProvider>
            </SafeAreaProvider>
          </ThirdwebProvider>
        </SmartWalletsProvider>
      </PrivyProvider>
    </QueryClientProvider>
    // </PersistQueryClientProvider>
  )
}
