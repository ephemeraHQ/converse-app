import { PrivyProvider } from "@privy-io/expo";
import * as Clipboard from "expo-clipboard";
import { DevToolsBubble } from "react-native-react-query-devtools";
import ActionSheetStateHandler from "@/components/StateHandlers/ActionSheetStateHandler";
import { useHydrateAuth } from "@/features/authentication/use-hydrate-auth";
import { useLogoutOnJwtRefreshError } from "@/features/authentication/use-logout-on-jwt-refresh-error";
import { useInitializeMultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";
import { setupStreamingSubscriptions } from "@/features/streams/streams";
import { $globalStyles } from "@/theme/styles";
import { configure as configureCoinbase } from "@coinbase/wallet-mobile-sdk";
import { DebugButton } from "@components/DebugButton";
import { Snackbars } from "@components/Snackbar/Snackbars";
import { BottomSheetModalProvider } from "@design-system/BottomSheet/BottomSheetModalProvider";
import { useReactQueryDevTools } from "@dev-plugins/react-query";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { SmartWalletsProvider } from "@privy-io/expo/smart-wallets";
import { queryClient } from "@queries/queryClient";
import { MaterialDarkTheme, MaterialLightTheme } from "@styles/colors";
import { QueryClientProvider } from "@tanstack/react-query";
import { useThemeProvider } from "@theme/useAppTheme";
import { setupAppAttest } from "@utils/appCheck";
import { useCoinbaseWalletListener } from "@utils/coinbaseWallet";
import "expo-dev-client";
import React, { useEffect, useMemo } from "react";
import { Platform, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { Provider as PaperProvider } from "react-native-paper";
import {
  ReanimatedLogLevel,
  configureReanimatedLogger,
} from "react-native-reanimated";
import { ThirdwebProvider } from "thirdweb/react";
import { config } from "./config";
import { useMonitorNetworkConnectivity } from "./dependencies/NetworkMonitor/use-monitor-network-connectivity";
import { Main } from "./screens/Main";
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
  const colorScheme = useColorScheme();

  useInitializeMultiInboxClient();
  useLogoutOnJwtRefreshError();
  useMonitorNetworkConnectivity();
  useHydrateAuth();
  useReactQueryDevTools(queryClient);

  const { themeScheme, setThemeContextOverride, ThemeProvider } =
    useThemeProvider();

  const paperTheme = useMemo(() => {
    return colorScheme === "dark" ? MaterialDarkTheme : MaterialLightTheme;
  }, [colorScheme]);

  useEffect(() => {
    setupAppAttest();
    setupStreamingSubscriptions();
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
                  <PaperProvider theme={paperTheme}>
                    <GestureHandlerRootView style={$globalStyles.flex1}>
                      <BottomSheetModalProvider>
                        {/* <AuthenticateWithPasskeyProvider> */}
                        <Main />
                        {/* </AuthenticateWithPasskeyProvider> */}
                        {__DEV__ && <DevToolsBubble onCopy={onCopy} />}
                        <DebugButton />
                        <ActionSheetStateHandler />
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
