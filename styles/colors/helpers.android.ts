import logger from "@utils/logger";
import { ColorSchemeName } from "react-native";

import { backgroundColor, rgbStringToHex } from ".";

export const setAndroidSystemColor = (color: string) => {
  const BackgroundColor = require("react-native-background-color");
  const SystemNavigationBar =
    require("react-native-system-navigation-bar").default;
  try {
    BackgroundColor.setColor(color);
  } catch (e) {
    logger.error(e);
  }
  SystemNavigationBar.setNavigationColor(color).catch((e: any) => {
    logger.error(e);
  });
};

export const setAndroidColors = (colorScheme: ColorSchemeName) => {
  const color = rgbStringToHex(backgroundColor(colorScheme));
  setAndroidSystemColor(color);
  const SystemNavigationBar =
    require("react-native-system-navigation-bar").default;
  SystemNavigationBar.setBarMode(
    colorScheme === "dark" ? "light" : "dark"
  ).catch((e: any) => {
    logger.error(e);
  });
};
