import "reflect-metadata";
import "./polyfills";

import DebugButton from "@components/DebugButton";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { PortalProvider } from "@gorhom/portal";
import { PrivyProvider } from "@privy-io/expo";
import { queryClient } from "@queries/queryClient";
import {
  backgroundColor,
  MaterialDarkTheme,
  MaterialLightTheme,
} from "@styles/colors";
import { QueryClientProvider } from "@tanstack/react-query";
import { useCoinbaseWalletListener } from "@utils/coinbaseWallet";
import { converseEventEmitter } from "@utils/events";
import logger from "@utils/logger";
import React, { useCallback, useEffect, useRef } from "react";
import {
  LogBox,
  Platform,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { Provider as PaperProvider } from "react-native-paper";
import { ThirdwebProvider } from "thirdweb/react";
import "./utils/splash/splash";

import XmtpEngine from "./components/XmtpEngine";
import config from "./config";
import { useAppStore } from "./data/store/appStore";
import { useSelect } from "./data/store/storeHelpers";
import {
  runAsyncUpdates,
  updateLastVersionOpen,
} from "./data/updates/asyncUpdates";
import Main from "./screens/Main";
import { registerBackgroundFetchTask } from "./utils/background";
import { privySecureStorage } from "./utils/keychain/helpers";
import { initSentry } from "./utils/sentry";

LogBox.ignoreLogs([
  "Privy: Expected status code 200, received 400", // Privy
  "Error destroying session", // Privy
  'event="noNetwork', // ethers
]);

initSentry();

export default function App() {
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const debugRef = useRef();

  useCoinbaseWalletListener(
    true,
    new URL(`https://${config.websiteDomain}/coinbase`)
  );

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

  // On Android we use the default keyboard "animation"
  const AppKeyboardProvider =
    Platform.OS === "ios" ? KeyboardProvider : React.Fragment;

  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider appId={config.privy.appId} storage={privySecureStorage}>
        <ThirdwebProvider>
          <AppKeyboardProvider>
            <ActionSheetProvider>
              <PaperProvider
                theme={
                  colorScheme === "dark"
                    ? MaterialDarkTheme
                    : MaterialLightTheme
                }
              >
                <PortalProvider>
                  <View style={styles.safe}>
                    <XmtpEngine />
                    <Main />
                    <DebugButton ref={debugRef} />
                  </View>
                </PortalProvider>
              </PaperProvider>
            </ActionSheetProvider>
          </AppKeyboardProvider>
        </ThirdwebProvider>
      </PrivyProvider>
    </QueryClientProvider>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: backgroundColor(colorScheme),
    },
  });
};
