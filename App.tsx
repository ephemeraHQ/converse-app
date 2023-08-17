import "reflect-metadata";
import "./polyfills";
import { configure as configureCoinbase } from "@coinbase/wallet-mobile-sdk";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { Ethereum } from "@thirdweb-dev/chains";
import { coinbaseWallet, ThirdwebProvider } from "@thirdweb-dev/react-native";
import React, { useEffect, useState } from "react";
import { StyleSheet, useColorScheme, View } from "react-native";
import "./utils/splash/splash";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { Provider as PaperProvider } from "react-native-paper";
import * as Sentry from "sentry-expo";

import XmtpState from "./components/XmtpState";
import XmtpWebview from "./components/XmtpWebview";
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
      <KeyboardProvider>
        <ActionSheetProvider>
          <PaperProvider
            theme={
              colorScheme === "light" ? MaterialLightTheme : MaterialDarkTheme
            }
          >
            <View style={styles.safe}>
              <XmtpWebview />
              <XmtpState />
              <Main />
            </View>
          </PaperProvider>
        </ActionSheetProvider>
      </KeyboardProvider>
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
    hiddenXmtpWebviewContainer: {
      flex: 0,
      height: 0,
    },
  });
};
