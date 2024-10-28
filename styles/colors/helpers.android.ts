import { ColorSchemeName } from "react-native";

import { backgroundColor } from ".";

export const setAndroidSystemColor = (color: string) => {
  const BackgroundColor = require("react-native-background-color");
  // const SystemNavigationBar =
  //   require("react-native-system-navigation-bar").default;
  // try {
  //   BackgroundColor.setColor(color);
  // } catch (e) {
  //   logger.error(e);
  // }
  // SystemNavigationBar.setNavigationColor(color).catch((e: any) => {
  //   logger.error(e);
  // });
};

export const setAndroidColors = (colorScheme: ColorSchemeName) => {
  const color = rgbStringToHex(backgroundColor(colorScheme));
  setAndroidSystemColor(color);
  // const SystemNavigationBar =
  //   require("react-native-system-navigation-bar").default;
  // SystemNavigationBar.setBarMode(
  //   colorScheme === "dark" ? "light" : "dark"
  // ).catch((e: any) => {
  //   logger.error(e);
  // });
};

const rgbStringToHex = (rgbString: string) => {
  const splitted = rgbString.split("(")[1].split(")")[0].split(",");
  const hexValue = splitted
    .map((x: string) => {
      x = parseInt(x, 10).toString(16);
      return x.length === 1 ? "0" + x : x;
    })
    .join("");
  return `#${hexValue}`;
};
