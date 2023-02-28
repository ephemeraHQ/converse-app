import "reflect-metadata";
import "./polyfills";
import AsyncStorage from "@react-native-async-storage/async-storage";
import WalletConnectProvider from "@walletconnect/react-native-dapp";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, useColorScheme, View } from "react-native";
// eslint-disable-next-line import/order
import * as SplashScreen from "expo-splash-screen";
import * as Sentry from "sentry-expo";

import XmtpWebview from "./components/XmtpWebview";
import config from "./config";
import { AppProvider } from "./data/store/context";
import Main from "./screens/Main";

SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

Sentry.init({
  dsn: config.sentryDSN,
  enableInExpoDevelopment: false,
  debug: config.env === "dev",
  environment: config.env,
});

export default function App() {
  const colorScheme = useColorScheme();
  return (
    <WalletConnectProvider
      redirectUrl={`${config.scheme}://"`}
      storageOptions={{
        // @ts-expect-error: Internal
        asyncStorage: AsyncStorage,
      }}
      clientMeta={{
        description:
          "Converse connects web3 identities with each other via messaging.",
        url: "https://getconverse.app",
        icons: ["https://i.postimg.cc/qvfXMMDT/icon.png"],
        name: "Converse",
      }}
    >
      <AppProvider>
        <View style={styles.safe}>
          <StatusBar
            hidden={false}
            style={colorScheme === "dark" ? "light" : "dark"}
          />
          <XmtpWebview />
          <Main />
        </View>
      </AppProvider>
    </WalletConnectProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  hiddenXmtpWebviewContainer: {
    flex: 0,
    height: 0,
  },
});
