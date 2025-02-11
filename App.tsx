import { PrivyProvider } from "@privy-io/expo";
import { DevToolsBubble } from "react-native-react-query-devtools";
import * as Clipboard from "expo-clipboard";
// This is a requirement for Privy to work, does not make any sense
// To test run yarn start --no-dev --minify

import { configure as configureCoinbase } from "@coinbase/wallet-mobile-sdk";
import { DebugButton } from "@components/DebugButton";
import {
  AppState,
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
import { SmartWalletsProvider } from "@privy-io/expo/smart-wallets";
import { queryClient } from "@queries/queryClient";
import { MaterialDarkTheme, MaterialLightTheme } from "@styles/colors";
import { focusManager, QueryClientProvider } from "@tanstack/react-query";
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
import { Main } from "./screens/Main";
import { initSentry } from "./utils/sentry";
import { saveApiURI } from "./utils/sharedData";
import { preventSplashScreenAutoHide } from "./utils/splash/splash";
import { setupStreamingSubscriptions } from "@/features/streams/streams";
import {
  MultiInboxClient,
  useInitializeMultiInboxClient,
} from "@/features/multi-inbox/multi-inbox.client";
import { useAppStateHandlers } from "./hooks/useAppStateHandlers";
import { useInstalledWallets } from "@/features/wallets/use-installed-wallets.hook";
import logger from "./utils/logger";
import { useAccountsStore } from "./features/multi-inbox/multi-inbox.store";
import { SignupWithPasskeyProvider } from "./features/onboarding/contexts/signup-with-passkey.context";
import { PrivyPlaygroundLandingScreen } from "./features/privy-playground/privy-playground-landing.screen";

!!preventSplashScreenAutoHide && preventSplashScreenAutoHide();

const IGNORED_LOGS = [
  "Couldn't find real values for `KeyboardContext",
  "Error destroying session",
  'event="noNetwork',
  "[Reanimated] Reading from `value` during component render",
  "Attempted to import the module",
  'Attempted to import the module "/Users',
  "Falling back to file-based resolution",
  "sync worker error storage error: Pool needs to  reconnect before use",
  "Require cycle", // This will catch all require cycle warnings
];

// Workaround for console filtering in development
if (__DEV__) {
  const connectConsoleTextFromArgs = (arrayOfStrings: string[]): string =>
    arrayOfStrings
      .slice(1)
      .reduce(
        (baseString, currentString) => baseString.replace("%s", currentString),
        arrayOfStrings[0]
      );

  const filterIgnoredMessages =
    (consoleLog: typeof console.log) =>
    (...args: any[]) => {
      const output = connectConsoleTextFromArgs(args);

      if (!IGNORED_LOGS.some((log) => output.includes(log))) {
        consoleLog(...args);
      }
    };

  console.log = filterIgnoredMessages(console.log);
  console.info = filterIgnoredMessages(console.info);
  console.warn = filterIgnoredMessages(console.warn);
  console.error = filterIgnoredMessages(console.error);
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
  useEffect(() => {
    AppState.addEventListener("change", (state) => {
      logger.debug("[App] AppState changed to", state);
      focusManager.setFocused(state === "active");
    });
  }, []);

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
// import { DevToolsBubble } from "react-native-react-query-devtools";

export function AppWithProviders() {
  useInitializeMultiInboxClient();
  const colorScheme = useColorScheme();

  const paperTheme = useMemo(() => {
    return colorScheme === "dark" ? MaterialDarkTheme : MaterialLightTheme;
  }, [colorScheme]);

  useReactQueryDevTools(queryClient);

  const { themeScheme, setThemeContextOverride, ThemeProvider } =
    useThemeProvider();

  const onCopy = async (text: string) => {
    try {
      // For Expo:
      await Clipboard.setStringAsync(text);
      // OR for React Native CLI:
      // await Clipboard.setString(text);
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
        // storage={privySecureStorage} // Temporary removed until we see if really needed
        // supportedChains={[base]} // Temporary removed until we see if really needed
      >
        <SmartWalletsProvider>
          <ThirdwebProvider>
            <AppKeyboardProvider>
              <ActionSheetProvider>
                <ThemeProvider value={{ themeScheme, setThemeContextOverride }}>
                  <PaperProvider theme={paperTheme}>
                    <GestureHandlerRootView style={{ flex: 1 }}>
                      <BottomSheetModalProvider>
                        {/* <App /> */}
                        <SignupWithPasskeyProvider>
                          <PrivyPlaygroundLandingScreen />
                        </SignupWithPasskeyProvider>
                        <DevToolsBubble onCopy={onCopy} />
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
