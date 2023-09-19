import "reflect-metadata";
import "./polyfills";
import { configure as configureCoinbase } from "@coinbase/wallet-mobile-sdk";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { Ethereum } from "@thirdweb-dev/chains";
import { coinbaseWallet, ThirdwebProvider } from "@thirdweb-dev/react-native";
import React, { useEffect, useState } from "react";
import { Platform, StyleSheet, useColorScheme, View } from "react-native";
import "./utils/splash/splash";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { Provider as PaperProvider } from "react-native-paper";
import * as Sentry from "sentry-expo";

import XmtpEngine from "./components/XmtpEngine";
import config from "./config";
import { migrateDataIfNeeded } from "./data/refacto";
import Main from "./screens/Main";
import {
  backgroundColor,
  MaterialDarkTheme,
  MaterialLightTheme,
} from "./utils/colors";
import mmkv from "./utils/mmkv";
import { DEFAULT_EMOJIS, RECENT_EMOJI_STORAGE_KEY } from "./utils/reactions";
import { useRecentPicksPersistence } from "./vendor/rn-emoji-keyboard";

configureCoinbase({
  callbackURL: new URL(`https://${config.websiteDomain}/coinbase`),
  hostURL: new URL("https://wallet.coinbase.com/wsegue"),
  hostPackageName: "org.toshi",
});

Sentry.init({
  dsn: config.sentryDSN,
  enableInExpoDevelopment: false,
  debug: config.env === "dev",
  environment: config.env,
});

export default function App() {
  const colorScheme = useColorScheme();
  const styles = useStyles();
  useRecentPicksPersistence({
    initialization: () =>
      JSON.parse(mmkv.getString(RECENT_EMOJI_STORAGE_KEY) || DEFAULT_EMOJIS),
    onStateChange: (next) => {
      mmkv.set(RECENT_EMOJI_STORAGE_KEY, JSON.stringify(next));
    },
  });
  const [refactoMigrationDone, setRefactoMigrationDone] = useState(false);
  useEffect(() => {
    migrateDataIfNeeded()
      .then(() => {
        setRefactoMigrationDone(true);
      })
      .catch((e) => {
        console.log(e);
      });
  }, []);

  if (!refactoMigrationDone) return null;

  // On Android we use the default keyboard "animation"
  const AppKeyboardProvider =
    Platform.OS === "ios" ? KeyboardProvider : React.Fragment;

  return (
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
