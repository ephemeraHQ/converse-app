import { PrivyProvider } from "@privy-io/expo";
import * as Clipboard from "expo-clipboard";
import { DevToolsBubble } from "react-native-react-query-devtools";
// This is a requirement for Privy to work, does not make any sense
// To test run yarn start --no-dev --minify

import { ActionSheetStateHandler } from "@/components/StateHandlers/ActionSheetStateHandler";
import NetworkStateHandler from "@/components/StateHandlers/NetworkStateHandler";
import {
  // MultiInboxClient,
  useInitializeMultiInboxClient,
} from "@/features/multi-inbox/multi-inbox.client";
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
import "expo-dev-client";
import React, { useMemo } from "react";
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
import { AppNavigator } from "./screens/app-navigator";
import { initSentry } from "./utils/sentry";
import { preventSplashScreenAutoHide } from "./utils/splash/splash";
// import { useAppStateHandlers } from "./hooks/useAppStateHandlers";
// import { useInstalledWallets } from "@/features/wallets/use-installed-wallets.hook";
// import { useAccountsStore } from "./features/multi-inbox/multi-inbox.store";
// import { AuthenticateWithPasskeyProvider } from "./features/onboarding/contexts/signup-with-passkey.context";
// import { PrivyPlaygroundLandingScreen } from "./features/privy-playground/privy-playground-landing.screen";

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

// On Android we use the default keyboard "animation"
const AppKeyboardProvider =
  Platform.OS === "ios" ? KeyboardProvider : React.Fragment;

// import { DevToolsBubble } from "react-native-react-query-devtools";

export function App() {
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
                    <GestureHandlerRootView style={$globalStyles.flex1}>
                      <BottomSheetModalProvider>
                        <AppNavigator />
                        {/* <AuthenticateWithPasskeyProvider>
                          <PrivyPlaygroundLandingScreen />
                        </AuthenticateWithPasskeyProvider> */}
                        {__DEV__ && <DevToolsBubble onCopy={onCopy} />}
                        <ActionSheetStateHandler />
                        <NetworkStateHandler />
                        <DebugButton />
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
