import { Platform } from "react-native";

export const MENU_ITEM_HEIGHT = 44;

export const AUXILIARY_VIEW_GAP = 75;

// Context menu gap per platform due to menu shape/size differences
export const MENU_GAP = Platform.select({
  default: 6,
  android: 16,
});

/** @deprecated */
export const BACKDROP_LIGHT_BACKGROUND_COLOR =
  Platform.OS === "ios" ? "rgba(0,0,0,0.2)" : "rgba(19, 19, 19, 0.95)";

/** @deprecated */
export const BACKDROP_DARK_BACKGROUND_COLOR =
  Platform.OS === "ios" ? "rgba(0,0,0,0.75)" : "rgba(120,120,120,0.2)";

/** @deprecated */
export const contextMenuStyleGuide = {
  spacing: 8,
  palette: {
    primary: "#0072ff",
    secondary: "#e2e2e2",
    common: {
      white: "#fff",
      black: "#000",
    },
  },
  typography: {
    body: {
      fontSize: 17,
      lineHeight: 20,
    },
    callout: {
      fontSize: 16,
      lineHeight: 20,
    },
    callout2: {
      fontSize: 14,
      lineHeight: 18,
    },
  },
};
