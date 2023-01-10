import "reflect-metadata";
import "./polyfills";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, useColorScheme, View } from "react-native";
// eslint-disable-next-line import/order
import * as SplashScreen from "expo-splash-screen";
import XmtpWebview from "./components/XmtpWebview";
import { AppProvider } from "./data/store/context";
import Main from "./screens/Main";
import XmtpTest from "./screens/XmtpTest";
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

export default function App() {
  const colorScheme = useColorScheme();
  return (
    <AppProvider>
      <View style={styles.safe}>
        <StatusBar
          hidden={false}
          style={colorScheme === "dark" ? "light" : "dark"}
        />
        <XmtpWebview />
        <Main />
        <XmtpTest />
      </View>
    </AppProvider>
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
