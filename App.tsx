import { ActionSheet } from "@/components/action-sheet";
import { DebugButton } from "@/components/debug-button";
import { Snackbars } from "@/components/snackbar/snackbars";
import { useHydrateAuth } from "@/features/authentication/use-hydrate-auth";
import { useLogoutOnJwtRefreshError } from "@/features/authentication/use-logout-on-jwt-refresh-error";
import { useInitializeMultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";
import { useSetupStreamingSubscriptions } from "@/features/streams/streams";
import { $globalStyles } from "@/theme/styles";
import { configure as configureCoinbase } from "@coinbase/wallet-mobile-sdk";
import { BottomSheetModalProvider } from "@design-system/BottomSheet/BottomSheetModalProvider";
import { useReactQueryDevTools } from "@dev-plugins/react-query";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { PrivyProvider } from "@privy-io/expo";
import { SmartWalletsProvider } from "@privy-io/expo/smart-wallets";
import { queryClient } from "@queries/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { useThemeProvider } from "@/theme/use-app-theme";
import { setupAppAttest } from "@utils/appCheck";
import { useCoinbaseWalletListener } from "@utils/coinbaseWallet";
import * as Clipboard from "expo-clipboard";
import "expo-dev-client";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { Provider as PaperProvider } from "react-native-paper";
import { DevToolsBubble } from "react-native-react-query-devtools";
import {
  ReanimatedLogLevel,
  configureReanimatedLogger,
} from "react-native-reanimated";
import { ThirdwebProvider } from "thirdweb/react";
import { config } from "./config";
import { useMonitorNetworkConnectivity } from "./dependencies/NetworkMonitor/use-monitor-network-connectivity";
import { AppNavigator } from "./navigation/app-navigator";
import "./utils/ignore-logs";
import { sentryInit } from "./utils/sentry";
import { preventSplashScreenAutoHide } from "./utils/splash/splash";

!!preventSplashScreenAutoHide && preventSplashScreenAutoHide();

// This is the default configuration
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: /*
 Ignores the following warning: 
   "[Reanimated] Reading from `value` during component render. Please ensure that you do not access the `value` property or use `get` method of a shared value while React is rendering a component.",
todo investigate

  */ false,
});

sentryInit();

configureCoinbase({
  callbackURL: new URL(`https://${config.websiteDomain}/coinbase`),
  hostURL: new URL("https://wallet.coinbase.com/wsegue"),
  hostPackageName: "org.toshi",
});

const coinbaseUrl = new URL(`https://${config.websiteDomain}/coinbase`);

export function App() {
  useInitializeMultiInboxClient();
  useLogoutOnJwtRefreshError();
  useMonitorNetworkConnectivity();
  useHydrateAuth();
  useReactQueryDevTools(queryClient);
  useSetupStreamingSubscriptions();

  const { themeScheme, setThemeContextOverride, ThemeProvider } =
    useThemeProvider();

  useEffect(() => {
    setupAppAttest();
  }, []);

  useCoinbaseWalletListener(true, coinbaseUrl);

  const onCopy = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId={config.privy.appId}
        clientId={config.privy.clientId}
      >
        <SmartWalletsProvider>
          <ThirdwebProvider>
            <AppKeyboardProvider>
              <ActionSheetProvider>
                <ThemeProvider value={{ themeScheme, setThemeContextOverride }}>
                  <PaperProvider>
                    <GestureHandlerRootView style={$globalStyles.flex1}>
                      <BottomSheetModalProvider>
                        {/* <AuthenticateWithPasskeyProvider> */}
                        <AppNavigator />
                        {/* </AuthenticateWithPasskeyProvider> */}
                        {__DEV__ && <DevToolsBubble onCopy={onCopy} />}
                        <DebugButton />
                        <ActionSheet />
                        <Snackbars />
                      </BottomSheetModalProvider>
                    </GestureHandlerRootView>
                  </PaperProvider>
                </ThemeProvider>
              </ActionSheetProvider>
            </AppKeyboardProvider>
          </ThirdwebProvider>
        </SmartWalletsProvider>
      </PrivyProvider>
    </QueryClientProvider>
  );
}

// On Android we use the default keyboard "animation"
const AppKeyboardProvider =
  Platform.OS === "ios" ? KeyboardProvider : React.Fragment;
