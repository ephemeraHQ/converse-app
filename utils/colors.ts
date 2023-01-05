import { ColorSchemeName } from "react-native";

const BACKGROUND_LIGHT = "#FFF";
const BACKGROUND_DARK = "#111";

export const backgroundColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark") return BACKGROUND_DARK;
  return BACKGROUND_LIGHT;
};

const TITLES_LIGHT = "#000";
const TITLES_DARK = "#FFF";

export const titlesColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark") return TITLES_DARK;
  return TITLES_LIGHT;
};

const CLICKED_ITEM_BACKGROUND_LIGHT = "#EEE";
const CLICKED_ITEM_BACKGROUND_DARK = "#222";

export const clickedItemBackgroundColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark") return CLICKED_ITEM_BACKGROUND_DARK;
  return CLICKED_ITEM_BACKGROUND_LIGHT;
};
