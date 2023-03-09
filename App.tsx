import "reflect-metadata";
import "./polyfills";
import messaging from "@react-native-firebase/messaging";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  ColorSchemeName,
  Platform,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
// eslint-disable-next-line import/order
import * as SplashScreen from "expo-splash-screen";
import * as Sentry from "sentry-expo";

import XmtpWebview from "./components/XmtpWebview";
import config from "./config";
import { AppProvider } from "./data/store/context";
import Main from "./screens/Main";
import { handleAndroidBackgroundNotification } from "./utils/backgroundNotifications/android";
import { backgroundColor } from "./utils/colors";

SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

Sentry.init({
  dsn: config.sentryDSN,
  enableInExpoDevelopment: false,
  debug: config.env === "dev",
  environment: config.env,
});

if (Platform.OS === "android") {
  // Register background handler
  messaging().onMessage(handleAndroidBackgroundNotification);
  messaging().setBackgroundMessageHandler(handleAndroidBackgroundNotification);
}

export default function App() {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  return (
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
