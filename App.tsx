// Keep this at the top
import "./polyfills";
import * as Privy from "@privy-io/expo";

// This is a requirement for Privy to work, does not make any sense
// To test run yarn start --no-dev --minify
const PrivyProvider = Privy.PrivyProvider;

import { configure as configureCoinbase } from "@coinbase/wallet-mobile-sdk";
import DebugButton from "@components/DebugButton";
import { BottomSheetModalProvider } from "@design-system/BottomSheet/BottomSheetModalProvider";
import { useReactQueryDevTools } from "@dev-plugins/react-query";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { useAppStateHandlers } from "@hooks/useAppStateHandlers";
import { SmartWalletsProvider } from "@privy-io/expo/smart-wallets";
import { queryClient } from "@queries/queryClient";
import { MaterialDarkTheme, MaterialLightTheme } from "@styles/colors";
import { QueryClientProvider } from "@tanstack/react-query";
import { useThemeProvider } from "@theme/useAppTheme";
import { useCoinbaseWalletListener } from "@utils/coinbaseWallet";
import { converseEventEmitter } from "@utils/events";
import logger from "@utils/logger";
import "expo-dev-client";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  LogBox,
  Platform,
  StyleSheet,
  View,
  useColorScheme,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { Provider as PaperProvider } from "react-native-paper";
import {
  ReanimatedLogLevel,
  configureReanimatedLogger,
} from "react-native-reanimated";
import { ThirdwebProvider } from "thirdweb/react";
import { Snackbars } from "@components/Snackbar/Snackbars";
import { setupAppAttest } from "@utils/appCheck";
import { base } from "viem/chains";
import { xmtpEngine } from "./components/XmtpEngine";
import { config } from "./config";
import {
  TEMPORARY_ACCOUNT_NAME,
  useAccountsStore,
} from "./data/store/accountsStore";
import { setAuthStatus } from "./data/store/authStore";
import "./features/notifications/utils";
import Main from "./screens/Main";
import { registerBackgroundFetchTask } from "./utils/background";
import { privySecureStorage } from "./utils/keychain/helpers";
import { initSentry } from "./utils/sentry";
import { saveApiURI } from "./utils/sharedData";
import "./utils/splash/splash";

LogBox.ignoreLogs([
  "Privy: Expected status code 200, received 400", // Privy
  "Error destroying session", // Privy
  'event="noNetwork', // ethers
  "[Reanimated] Reading from `value` during component render. Please ensure that you do not access the `value` property or use `get` method of a shared value while React is rendering a component.",
  "Attempted to import the module",
  "Falling back to file-based resolution. Consider updating the call site or asking the package maintainer(s) to expose this API",
  "Couldn't find real values for `KeyboardContext`. Please make sure you're inside of `KeyboardProvider` - otherwise functionality of `react-native-keyboard-controller` will not work. [Component Stack]",
  "sync worker error storage error: Pool needs to  reconnect before use",
  "[Converse.debug.dylib] sync worker error storage error: Pool needs to  reconnect before use",
  "Falling back to file-based resolution. Consider updating the call site or asking the package maintainer(s) to expose this API.",
]);

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

xmtpEngine.start();

const App = () => {
  const styles = useStyles();
  const debugRef = useRef();

  useEffect(() => {
    setupAppAttest();
  }, []);

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
  useEffect(() => {
    const currentAccount = useAccountsStore.getState().currentAccount;
    if (currentAccount && currentAccount !== TEMPORARY_ACCOUNT_NAME) {
      setAuthStatus("signedIn");
    } else {
      setAuthStatus("signedOut");
    }
  }, []);

  useAppStateHandlers({
    onBackground() {
      logger.debug("App is in background");
    },
    onForeground() {
      logger.debug("App is in foreground");
    },
    onInactive() {
      logger.debug("App is inactive");
    },
  });

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
        storage={privySecureStorage}
        supportedChains={[base]}
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
