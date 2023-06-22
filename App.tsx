import "reflect-metadata";
import "./polyfills";
import { configure as configureCoinbase } from "@coinbase/wallet-mobile-sdk";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { Ethereum } from "@thirdweb-dev/chains";
import { ThirdwebProvider } from "@thirdweb-dev/react-native";
import React from "react";
import {
  ColorSchemeName,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import "./utils/splash/splash";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { Provider as PaperProvider } from "react-native-paper";
import * as Sentry from "sentry-expo";

import XmtpState from "./components/XmtpState";
import XmtpWebview from "./components/XmtpWebview";
import config from "./config";
import { AppProvider } from "./data/store/context";
import Main from "./screens/Main";
import {
  backgroundColor,
  MaterialDarkTheme,
  MaterialLightTheme,
} from "./utils/colors";

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
  const styles = getStyles(colorScheme);

  return (
    <ThirdwebProvider
      activeChain={Ethereum}
      dAppMeta={{
        ...config.walletConnectConfig.dappMetadata,
        isDarkMode: colorScheme === "dark",
      }}
      autoConnect={false}
    >
      <KeyboardProvider>
        <AppProvider>
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
        </AppProvider>
      </KeyboardProvider>
    </ThirdwebProvider>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: backgroundColor(colorScheme),
    },
    hiddenXmtpWebviewContainer: {
      flex: 0,
      height: 0,
    },
  });
