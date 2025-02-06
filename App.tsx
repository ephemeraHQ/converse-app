// Keep this at the top
import "./polyfills";

import * as Privy from "@privy-io/expo";

// This is a requirement for Privy to work, does not make any sense
// To test run yarn start --no-dev --minify
const PrivyProvider = Privy.PrivyProvider;

import { configure as configureCoinbase } from "@coinbase/wallet-mobile-sdk";
import DebugButton from "@components/DebugButton";
import {
  LogBox,
  Platform,
  StyleSheet,
  View,
  useColorScheme,
} from "react-native";
import { Snackbars } from "@components/Snackbar/Snackbars";
import { BottomSheetModalProvider } from "@design-system/BottomSheet/BottomSheetModalProvider";
import { useReactQueryDevTools } from "@dev-plugins/react-query";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { useAppStateHandlers } from "@hooks/useAppStateHandlers";
import { SmartWalletsProvider } from "@privy-io/expo/smart-wallets";
import { queryClient } from "@queries/queryClient";
import { MaterialDarkTheme, MaterialLightTheme } from "@styles/colors";
import { QueryClientProvider } from "@tanstack/react-query";
import { useThemeProvider } from "@theme/useAppTheme";
import { setupAppAttest } from "@utils/appCheck";
import { useCoinbaseWalletListener } from "@utils/coinbaseWallet";
import { converseEventEmitter } from "@utils/events";
import "expo-dev-client";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { Provider as PaperProvider } from "react-native-paper";
import {
  ReanimatedLogLevel,
  configureReanimatedLogger,
} from "react-native-reanimated";
import { ThirdwebProvider } from "thirdweb/react";
import { config } from "./config";
import Main from "./screens/Main";
import { registerBackgroundFetchTask } from "./utils/background";
import { initSentry } from "./utils/sentry";
import { saveApiURI } from "./utils/sharedData";
import { preventSplashScreenAutoHide } from "./utils/splash/splash";
import { setupStreamingSubscriptions } from "@/features/streams/streams";

preventSplashScreenAutoHide();

LogBox.ignoreLogs([
  "Privy: Expected status code 200, received 400", // Privy
  "Error destroying session", // Privy
  'event="noNetwork', // ethers
  "[Reanimated] Reading from `value` during component render. Please ensure that you do not access the `value` property or use `get` method of a shared value while React is rendering a component.",
  "Attempted to import the module", // General module import warnings
  'Attempted to import the module "/Users', // More specific module import warnings
  "Falling back to file-based resolution. Consider updating the call site or asking the package maintainer(s) to expose this API",
  "Couldn't find real values for `KeyboardContext`. Please make sure you're inside of `KeyboardProvider` - otherwise functionality of `react-native-keyboard-controller` will not work. [Component Stack]",
  "sync worker error storage error: Pool needs to  reconnect before use",
  "[Converse.debug.dylib] sync worker error storage error: Pool needs to  reconnect before use",
  "Falling back to file-based resolution. Consider updating the call site or asking the package maintainer(s) to expose this API.",
  "Require cycle: utils/keychain/helpers.ts -> utils/keychain/index.ts -> utils/keychain/helpers.ts",
  "Require cycle: data/store/accountsStore.ts -> utils/logout/index.tsx -> utils/xmtpRN/signIn.ts -> utils/xmtpRN/xmtp-client/xmtp-client-installations.ts -> data/store/accountsStore.ts",
  "Require cycle: data/store/accountsStore.ts -> utils/logout/index.tsx -> utils/xmtpRN/signIn.ts -> utils/xmtpRN/xmtp-client/xmtp-client-installations.ts -> utils/xmtpRN/xmtp-client/xmtp-client.ts -> utils/evm/address.ts -> utils/api/profiles.ts -> data/store/accountsStore.ts",
  "Require cycle: utils/xmtpRN/xmtp-client/xmtp-client-installations.ts -> utils/xmtpRN/xmtp-client/xmtp-client.ts -> utils/evm/address.ts -> utils/api/profiles.ts -> utils/api/api.ts -> utils/api/interceptors.ts -> utils/api/auth.ts -> utils/xmtpRN/xmtp-client/xmtp-client-installations.ts",
  "Require cycle: utils/xmtpRN/signIn.ts -> utils/xmtpRN/xmtp-client/xmtp-client-installations.ts -> utils/xmtpRN/xmtp-client/xmtp-client.ts -> utils/evm/address.ts -> utils/api/profiles.ts -> utils/api/api.ts -> utils/api/interceptors.ts -> utils/api/auth.ts -> utils/xmtpRN/signIn.ts",
  "Require cycle: utils/api/api.ts -> utils/api/interceptors.ts -> utils/api/auth.ts -> utils/api/api.ts",
  "Require cycle: utils/logout/index.tsx -> utils/xmtpRN/signIn.ts -> utils/xmtpRN/xmtp-client/xmtp-client-installations.ts -> utils/logout/index.tsx",
  "Require cycle: data/store/accountsStore.ts -> utils/logout/index.tsx -> data/store/accountsStore.ts",
  "Require cycle: data/store/accountsStore.ts -> utils/logout/index.tsx -> features/notifications/utils/resetNotifications.ts -> features/notifications/utils/notifications-badge.ts -> data/store/accountsStore.ts",
]);

if (__DEV__) {
  require("./ReactotronConfig.ts");
}

// This is the default configuration
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: /*
 Ignores the following warning: 
   "[Reanimated] Reading from `value` during component render. Please ensure that you do not access the `value` property or use `get` method of a shared value while React is rendering a component.",
todo investigate

  */ false,
});

configureCoinbase({
  callbackURL: new URL(`https://${config.websiteDomain}/coinbase`),
  hostURL: new URL("https://wallet.coinbase.com/wsegue"),
  hostPackageName: "org.toshi",
});

initSentry();

saveApiURI();

const coinbaseUrl = new URL(`https://${config.websiteDomain}/coinbase`);

const App = () => {
  const styles = useStyles();
  const debugRef = useRef();

  useEffect(() => {
    setupAppAttest();
    setupStreamingSubscriptions();
  }, []);

  const coinbaseUrl = new URL(`https://${config.websiteDomain}/coinbase`);
  useCoinbaseWalletListener(true, coinbaseUrl);

  useEffect(() => {
    registerBackgroundFetchTask();
  }, []);

  const showDebugMenu = useCallback(() => {
    if (!debugRef.current || !(debugRef.current as any).showDebugMenu) {
      return;
    }
    (debugRef.current as any).showDebugMenu();
  }, []);

  useEffect(() => {
    converseEventEmitter.on("showDebugMenu", showDebugMenu);
    return () => {
      converseEventEmitter.off("showDebugMenu", showDebugMenu);
    };
  }, [showDebugMenu]);

  // For now we use persit with zustand to get the accounts when the app launch so here is okay to see if we're logged in or not

  return (
    <View style={styles.safe}>
      <Main />
      <DebugButton ref={debugRef} />
    </View>
  );
};

// On Android we use the default keyboard "animation"
const AppKeyboardProvider =
  Platform.OS === "ios" ? KeyboardProvider : React.Fragment;

export default function AppWithProviders() {
  const colorScheme = useColorScheme();

  const paperTheme = useMemo(() => {
    return colorScheme === "dark" ? MaterialDarkTheme : MaterialLightTheme;
  }, [colorScheme]);

  useReactQueryDevTools(queryClient);

  const { themeScheme, setThemeContextOverride, ThemeProvider } =
    useThemeProvider();

  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId={config.privy.appId}
        clientId={config.privy.clientId}
        // config={{
        //   embedded: {
        //     ethereum: {
        // note(lustig): not working consistently and forks logic for new vs existing logins
        //       createOnLogin: "all-users",
        //     },
        //   },
        // }}
      >
        <SmartWalletsProvider>
          <ThirdwebProvider>
            <AppKeyboardProvider>
              <ActionSheetProvider>
                <ThemeProvider value={{ themeScheme, setThemeContextOverride }}>
                  <PaperProvider theme={paperTheme}>
                    <GestureHandlerRootView style={{ flex: 1 }}>
                      <BottomSheetModalProvider>
                        <App />
                        {/* <PrivyPlaygroundLandingScreen /> */}
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

const useStyles = () => {
  return useMemo(
    () =>
      StyleSheet.create({
        safe: {
          flex: 1,
        },
      }),
    []
  );
};
