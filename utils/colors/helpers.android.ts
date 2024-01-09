import { ColorSchemeName } from "react-native";

import { backgroundColor, rgbStringToHex } from ".";
import { sentryTrackError } from "../sentry";

export const setAndroidSystemColor = (color: string) => {
  const BackgroundColor = require("react-native-background-color");
  const SystemNavigationBar =
    require("react-native-system-navigation-bar").default;
  try {
    BackgroundColor.setColor(color);
  } catch (e) {
    sentryTrackError(e);
  }
  SystemNavigationBar.setNavigationColor(color).catch(sentryTrackError);
};

export const setAndroidColors = (colorScheme: ColorSchemeName) => {
  const color = rgbStringToHex(backgroundColor(colorScheme));
  setAndroidSystemColor(color);
  const SystemNavigationBar =
    require("react-native-system-navigation-bar").default;
  SystemNavigationBar.setBarMode(
    colorScheme === "dark" ? "light" : "dark"
  ).catch(sentryTrackError);
};
