import "expo-dev-client";
import "reflect-metadata";
import "./polyfills";

import { configure as configureCoinbase } from "@coinbase/wallet-mobile-sdk";
import DebugButton from "@components/DebugButton";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { PortalProvider } from "@gorhom/portal";
import { PrivyProvider } from "@privy-io/expo";
import { queryClient } from "@queries/queryClient";
import { MaterialDarkTheme, MaterialLightTheme } from "@styles/colors";
import { QueryClientProvider } from "@tanstack/react-query";
import { useAppTheme, useThemeProvider } from "@theme/useAppTheme";
import { useCoinbaseWalletListener } from "@utils/coinbaseWallet";
import { converseEventEmitter } from "@utils/events";
import logger from "@utils/logger";
import { StatusBar } from "expo-status-bar";
import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import {
  LogBox,
  Platform,
  StyleSheet,
  View,
  useColorScheme,
} from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { Provider as PaperProvider } from "react-native-paper";
import { ThirdwebProvider } from "thirdweb/react";

import ActionSheetStateHandler from "./components/StateHandlers/ActionSheetStateHandler";
import HydrationStateHandler from "./components/StateHandlers/HydrationStateHandler";
import InitialStateHandler from "./components/StateHandlers/InitialStateHandler";
import MainIdentityStateHandler from "./components/StateHandlers/MainIdentityStateHandler";
import NetworkStateHandler from "./components/StateHandlers/NetworkStateHandler";
import ConversationsStateHandler from "./components/StateHandlers/NotificationsStateHandler";
import WalletsStateHandler from "./components/StateHandlers/WalletsStateHandler";
import { xmtpCron, xmtpEngine } from "./components/XmtpEngine";
import config from "./config";
import {
  TEMPORARY_ACCOUNT_NAME,
  useAccountsStore,
} from "./data/store/accountsStore";
import { useAppStore } from "./data/store/appStore";
import { setAuthStatus } from "./data/store/authStore";
import { useSelect } from "./data/store/storeHelpers";
import {
  runAsyncUpdates,
  updateLastVersionOpen,
} from "./data/updates/asyncUpdates";
import { AppNavigator } from "./navigation/AppNavigator";
import { useAddressBookStateHandler } from "./utils/addressBook";
import { registerBackgroundFetchTask } from "./utils/background";
import { useAutoConnectExternalWallet } from "./utils/evm/external";
import { usePrivyAccessToken } from "./utils/evm/privy";
import { privySecureStorage } from "./utils/keychain/helpers";
import { initSentry } from "./utils/sentry";
import "./utils/splash/splash";
import { useCheckCurrentInstallation } from "./utils/xmtpRN/client";

LogBox.ignoreLogs([
  "Privy: Expected status code 200, received 400", // Privy
  "Error destroying session", // Privy
  'event="noNetwork', // ethers
]);

configureCoinbase({
  callbackURL: new URL(`https://${config.websiteDomain}/coinbase`),
  hostURL: new URL("https://wallet.coinbase.com/wsegue"),
  hostPackageName: "org.toshi",
});

initSentry();

const coinbaseUrl = new URL(`https://${config.websiteDomain}/coinbase`);

xmtpEngine.start();
xmtpCron.start();

const App = () => {
  const styles = useStyles();
  const debugRef = useRef();

  usePrivyAccessToken();
  useAddressBookStateHandler();
  useCheckCurrentInstallation();
  useAutoConnectExternalWallet();

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

  const { isInternetReachable, hydrationDone } = useAppStore(
    useSelect(["isInternetReachable", "hydrationDone"])
  );

  useEffect(updateLastVersionOpen, []);

  useEffect(() => {
    if (isInternetReachable && hydrationDone) {
      runAsyncUpdates().catch((e) => {
        logger.error(e);
      });
    }
  }, [isInternetReachable, hydrationDone]);

  // For now we use persit with zustand to get the accounts when the app launch so here is okay to see if we're logged in or not
  useEffect(() => {
    const currentAccount = useAccountsStore.getState().currentAccount;
    if (currentAccount && currentAccount !== TEMPORARY_ACCOUNT_NAME) {
      setAuthStatus("signedIn");
    } else {
      setAuthStatus("signedOut");
    }
  }, []);

  return (
    <View style={styles.safe}>
      <StatusBar />
      <AppNavigator />
      <DebugButton ref={debugRef} />
      <Initializer />
    </View>
  );
};

const Initializer = memo(function Initializer() {
  return (
    <>
      <HydrationStateHandler />
      <InitialStateHandler />
      <NetworkStateHandler />
      <MainIdentityStateHandler />
      <ConversationsStateHandler />
      <ActionSheetStateHandler />
      <WalletsStateHandler />
    </>
  );
});

// On Android we use the default keyboard "animation"
const AppKeyboardProvider =
  Platform.OS === "ios" ? KeyboardProvider : React.Fragment;

export default function AppWithProviders() {
  const colorScheme = useColorScheme();

  const paperTheme = useMemo(() => {
    return colorScheme === "dark" ? MaterialDarkTheme : MaterialLightTheme;
  }, [colorScheme]);

  const { themeScheme, setThemeContextOverride, ThemeProvider } =
    useThemeProvider();

  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider appId={config.privy.appId} storage={privySecureStorage}>
        <ThirdwebProvider>
          <AppKeyboardProvider>
            <ActionSheetProvider>
              <ThemeProvider value={{ themeScheme, setThemeContextOverride }}>
                <PaperProvider theme={paperTheme}>
                  <PortalProvider>
                    <App />
                  </PortalProvider>
                </PaperProvider>
              </ThemeProvider>
            </ActionSheetProvider>
          </AppKeyboardProvider>
        </ThirdwebProvider>
      </PrivyProvider>
    </QueryClientProvider>
  );
}

const useStyles = () => {
  const { theme } = useAppTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        safe: {
          flex: 1,
          backgroundColor: theme.colors.background.surface,
        },
      }),
    [theme]
  );
};
