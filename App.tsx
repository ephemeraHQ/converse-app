import React from "react";
import { StyleSheet, View } from "react-native";
// eslint-disable-next-line import/order
import * as SplashScreen from "expo-splash-screen";

import XmtpWebview from "./components/XmtpWebview";
import Navigation from "./screens/Navigation";
import { AppProvider } from "./store/context";

SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

export default function App() {
  return (
    <AppProvider>
      <View style={styles.safe}>
        <XmtpWebview />
        <Navigation />
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
