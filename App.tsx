import "reflect-metadata";
import "./polyfills";
import React from "react";
import {
  ColorSchemeName,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
// eslint-disable-next-line import/order
import "./utils/splash/splash";
import { Provider as PaperProvider } from "react-native-paper";
import * as Sentry from "sentry-expo";

import XmtpWebview from "./components/XmtpWebview";
import config from "./config";
import { AppProvider } from "./data/store/context";
import Main from "./screens/Main";
import {
  backgroundColor,
  MaterialDarkTheme,
  MaterialLightTheme,
} from "./utils/colors";

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
    <AppProvider>
      <PaperProvider
        theme={colorScheme === "light" ? MaterialLightTheme : MaterialDarkTheme}
      >
        <View style={styles.safe}>
          <XmtpWebview />
          <Main />
        </View>
      </PaperProvider>
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
