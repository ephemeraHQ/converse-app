import "reflect-metadata";
import "./polyfills";

import { configure as configureCoinbase } from "@coinbase/wallet-mobile-sdk";
import { useEnableDebug } from "@components/DebugButton";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { PrivyProvider } from "@privy-io/expo";
import {
  backgroundColor,
  MaterialDarkTheme,
  MaterialLightTheme,
} from "@styles/colors";
import { useCoinbaseWalletListener } from "@utils/coinbaseWallet";
import logger from "@utils/logger";
import React, { useEffect } from "react";
import {
  Alert,
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
import { QueryClientProvider } from "./queries/QueryProvider";
import Main from "./screens/Main";
import { registerBackgroundFetchTask } from "./utils/background";
import { privySecureStorage } from "./utils/keychain/helpers";
import mmkv from "./utils/mmkv";
import { DEFAULT_EMOJIS, RECENT_EMOJI_STORAGE_KEY } from "./utils/reactions";
import { initSentry } from "./utils/sentry";
import { useRecentPicksPersistence } from "./vendor/rn-emoji-keyboard";

import RNShake from "react-native-shake";

LogBox.ignoreLogs([
  "Privy: Expected status code 200, received 400", // Privy
  "Error destroying session", // Privy
]);

configureCoinbase({
  callbackURL: new URL(`https://${config.websiteDomain}/coinbase`),
  hostURL: new URL("https://wallet.coinbase.com/wsegue"),
  hostPackageName: "org.toshi",
});

initSentry();

export default function App() {
  const colorScheme = useColorScheme();
  const styles = useStyles();

  const enableDebug = useEnableDebug();

  useCoinbaseWalletListener(
    true,
    new URL(`https://${config.websiteDomain}/coinbase`)
  );

  useEffect(() => {
    registerBackgroundFetchTask();
  }, []);

  useEffect(() => {
    if (!enableDebug) return;
    const subscription = RNShake.addListener(() => {
      Alert.alert("Shake detected!", "You shook the device!");
    });

    // Clean up the subscription on unmount
    return () => {
      subscription.remove();
    };
  }, [enableDebug]);

  useRecentPicksPersistence({
    initialization: () =>
      JSON.parse(mmkv.getString(RECENT_EMOJI_STORAGE_KEY) || DEFAULT_EMOJIS),
    onStateChange: (next) => {
      mmkv.set(RECENT_EMOJI_STORAGE_KEY, JSON.stringify(next));
    },
  });

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
    <QueryClientProvider>
      <PrivyProvider appId={config.privy.appId} storage={privySecureStorage}>
        <ThirdwebProvider>
          <AppKeyboardProvider>
            <ActionSheetProvider>
              <PaperProvider
                theme={
                  colorScheme === "light"
                    ? MaterialLightTheme
                    : MaterialDarkTheme
                }
              >
                <View style={styles.safe}>
                  <XmtpEngine />
                  <Main />
                </View>
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
