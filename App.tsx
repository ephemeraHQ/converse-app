import "reflect-metadata";
import "./polyfills";
import AsyncStorage from "@react-native-async-storage/async-storage";
import WalletConnectProvider from "@walletconnect/react-native-dapp";
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, useColorScheme, View } from "react-native";
// eslint-disable-next-line import/order
import * as SplashScreen from "expo-splash-screen";
import uuid from "react-native-uuid";

import XmtpWebview from "./components/XmtpWebview";
import { AppProvider } from "./data/store/context";
import Main from "./screens/Main";

SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

export default function App() {
  const colorScheme = useColorScheme();
  return (
    <WalletConnectProvider
      redirectUrl={`${Linking.resolveScheme({})}://"`}
      storageOptions={{
        // @ts-expect-error: Internal
        asyncStorage: AsyncStorage,
        rootStorageKey: uuid.v4().toString(),
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
