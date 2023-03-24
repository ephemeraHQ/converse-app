import * as NavigationBar from "expo-navigation-bar";
import { ColorSchemeName, Platform } from "react-native";

import { backgroundColor } from "./colors";

export const setNavigationBarColor = (colorScheme: ColorSchemeName) => {
  if (Platform.OS === "android") {
    NavigationBar.setBackgroundColorAsync(backgroundColor(colorScheme));

    setTimeout(() => {
      NavigationBar.setBackgroundColorAsync(backgroundColor(colorScheme));
    }, 50);
  }
};
