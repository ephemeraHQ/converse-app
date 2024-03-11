import "reflect-metadata";
import "./polyfills";
import { configure as configureCoinbase } from "@coinbase/wallet-mobile-sdk";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { PrivyProvider } from "@privy-io/expo";
import { Ethereum } from "@thirdweb-dev/chains";
import { coinbaseWallet, ThirdwebProvider } from "@thirdweb-dev/react-native";
import React, { useEffect } from "react";
import {
  Platform,
  StyleSheet,
  useColorScheme,
  View,
  LogBox,
} from "react-native";
import "./utils/splash/splash";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { Provider as PaperProvider } from "react-native-paper";

import XmtpEngine from "./components/XmtpEngine";
import config from "./config";
import { useAppStore } from "./data/store/appStore";
import { useSelect } from "./data/store/storeHelpers";
import {
  updateLastVersionOpen,
  runAsyncUpdates,
} from "./data/updates/asyncUpdates";
import Main from "./screens/Main";
import { registerBackgroundFetchTask } from "./utils/background";
import {
  backgroundColor,
  MaterialDarkTheme,
  MaterialLightTheme,
} from "./utils/colors";
import { privySecureStorage } from "./utils/keychain/helpers";
import mmkv from "./utils/mmkv";
import { DEFAULT_EMOJIS, RECENT_EMOJI_STORAGE_KEY } from "./utils/reactions";
import { initSentry, sentryTrackError } from "./utils/sentry";
import { useRecentPicksPersistence } from "./vendor/rn-emoji-keyboard";

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

  useEffect(() => {
    registerBackgroundFetchTask();
  }, []);

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
        sentryTrackError(e);
      });
    }
  }, [isInternetReachable, hydrationDone]);

  // On Android we use the default keyboard "animation"
  const AppKeyboardProvider =
    Platform.OS === "ios" ? KeyboardProvider : React.Fragment;

  return (
    <PrivyProvider appId={config.privy.appId} storage={privySecureStorage}>
      <ThirdwebProvider
        activeChain={Ethereum}
        dAppMeta={{
          ...config.walletConnectConfig.dappMetadata,
          isDarkMode: colorScheme === "dark",
        }}
        autoConnect={false}
        clientId={config.thirdwebClientId}
        supportedWallets={[
          coinbaseWallet({
            callbackURL: new URL(`https://${config.websiteDomain}/coinbase`),
          }),
        ]}
      >
        <AppKeyboardProvider>
          <ActionSheetProvider>
            <PaperProvider
              theme={
                colorScheme === "light" ? MaterialLightTheme : MaterialDarkTheme
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
