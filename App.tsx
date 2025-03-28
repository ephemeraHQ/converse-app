import { BottomSheetModalProvider } from "@design-system/BottomSheet/BottomSheetModalProvider"
import { useReactQueryDevTools } from "@dev-plugins/react-query"
import { ActionSheetProvider } from "@expo/react-native-action-sheet"
import { Chain, PrivyProvider } from "@privy-io/expo"
import { SmartWalletsProvider } from "@privy-io/expo/smart-wallets"
import { ActionSheet } from "@/components/action-sheet"
import { DebugProvider } from "@/components/debug-provider"
import { Snackbars } from "@/components/snackbar/snackbars"
import { useSetupStreamingSubscriptions } from "@/features/streams/streams"
import { useCoinbaseWalletListener } from "@/features/wallets/utils/coinbase-wallet"
import { $globalStyles } from "@/theme/styles"
import { useThemeProvider } from "@/theme/use-app-theme"
import { useCachedResources } from "@/utils/cache-resources"
import { reactQueryClient } from "@/utils/react-query/react-query.client"
import "expo-dev-client"
import React from "react"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { KeyboardProvider } from "react-native-keyboard-controller"
import { SafeAreaProvider } from "react-native-safe-area-context"
// import { useSyncQueries } from "tanstack-query-dev-tools-expo-plugin"
import { ThirdwebProvider } from "thirdweb/react"
import { base } from "viem/chains"
// import { DevToolsBubble } from "react-native-react-query-devtools"
import { ConditionalWrapper } from "@/components/conditional-wrapper"
import { captureError } from "@/utils/capture-error"
import { setupConvosApi } from "@/utils/convos-api/convos-api-init"
import { ReactQueryPersistProvider } from "@/utils/react-query/react-query-persist-provider"
import { config } from "./config"
import { useMonitorNetworkConnectivity } from "./dependencies/NetworkMonitor/use-monitor-network-connectivity"
import { registerBackgroundNotificationTask } from "./features/notifications/background-notifications-handler"
import { setupConversationsNotificationsSubscriptions } from "./features/notifications/notifications-conversations-subscriptions"
import { configureForegroundNotificationBehavior } from "./features/notifications/notifications-init"
import { AppNavigator } from "./navigation/app-navigator"
import "./utils/ignore-logs"
import { sentryInit } from "./utils/sentry/sentry-init"
import { preventSplashScreenAutoHide } from "./utils/splash/splash"

preventSplashScreenAutoHide()
sentryInit()
setupConvosApi()
configureForegroundNotificationBehavior()
setupConversationsNotificationsSubscriptions()
registerBackgroundNotificationTask().catch(captureError)

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

  // Seems to be slowing the app. Need to investigate
  // useSyncQueries({ queryClient: reactQueryClient })

  const { themeScheme, setThemeContextOverride, ThemeProvider } = useThemeProvider()

  return (
    <ReactQueryPersistProvider>
      {/* <QueryClientProvider client={reactQueryClient}> */}
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
                      <ConditionalWrapper
                        condition={config.debugMenu}
                        wrapper={(children) => <DebugProvider>{children}</DebugProvider>}
                      >
                        <BottomSheetModalProvider>
                          {/* <AuthenticateWithPasskeyProvider> */}
                          <AppNavigator />
                          {/* </AuthenticateWithPasskeyProvider> */}
                          {/* {__DEV__ && <DevToolsBubble />} */}
                          <Snackbars />
                          <ActionSheet />
                        </BottomSheetModalProvider>
                      </ConditionalWrapper>
                    </GestureHandlerRootView>
                  </ThemeProvider>
                </ActionSheetProvider>
              </KeyboardProvider>
            </SafeAreaProvider>
          </ThirdwebProvider>
        </SmartWalletsProvider>
      </PrivyProvider>
    </ReactQueryPersistProvider>
  )
}
