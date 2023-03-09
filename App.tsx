import "reflect-metadata";
import "./polyfills";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import * as TaskManager from "expo-task-manager";
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
  const BACKGROUND_NOTIFICATION_TASK = "BACKGROUND-NOTIFICATION-TASK";
  TaskManager.defineTask(
    BACKGROUND_NOTIFICATION_TASK,
    ({ data, error, executionInfo }) => {
      console.log("Received a notification in the background!");
      // Do something with the notification data
      Notifications.scheduleNotificationAsync({
        content: {
          title: "Look at that notification",
          body: "I'm so proud of myself!",
        },
        trigger: null,
      });
    }
  );
  Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
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
