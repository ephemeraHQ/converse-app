import { Platform, StatusBar } from "react-native";

const HOLD_ITEM_TRANSFORM_DURATION = 280;

const MENU_ITEM_HEIGHT = 44;
const SPRING_CONFIGURATION = {
  damping: 33,
  mass: 1.03,
  stiffness: 500,
  restDisplacementThreshold: 0.001,
  restSpeedThreshold: 0.001,
};

const SIDE_MARGIN = 20;
const ITEM_WIDTH = 180;
const AUXILIARY_VIEW_MIN_HEIGHT = 205;

const BACKDROP_LIGHT_BACKGROUND_COLOR =
  Platform.OS === "ios" ? "rgba(0,0,0,0.2)" : "rgba(19, 19, 19, 0.95)";
const BACKDROP_DARK_BACKGROUND_COLOR =
  Platform.OS === "ios" ? "rgba(0,0,0,0.75)" : "rgba(120,120,120,0.2)";

const STATUS_BAR_HEIGHT =
  Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0;

const OUTTER_SPACING = 8;

export {
  SIDE_MARGIN,
  ITEM_WIDTH,
  AUXILIARY_VIEW_MIN_HEIGHT,
  MENU_ITEM_HEIGHT,
  HOLD_ITEM_TRANSFORM_DURATION,
  SPRING_CONFIGURATION,
  BACKDROP_LIGHT_BACKGROUND_COLOR,
  BACKDROP_DARK_BACKGROUND_COLOR,
  STATUS_BAR_HEIGHT,
  OUTTER_SPACING,
};

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
