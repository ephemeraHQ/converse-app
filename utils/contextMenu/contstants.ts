import { Dimensions, Platform } from "react-native";

const HOLD_ITEM_TRANSFORM_DURATION = 150;
const HOLD_ITEM_SCALE_DOWN_VALUE = 0.95;
const HOLD_ITEM_SCALE_DOWN_DURATION = 210;

const SPRING_CONFIGURATION = {
  damping: 33,
  mass: 1.03,
  stiffness: 500,
  restDisplacementThreshold: 0.001,
  restSpeedThreshold: 0.001,
};

const SPRING_CONFIGURATION_MENU = {
  damping: 39,
  mass: 1.09,
  stiffness: 500,
  restDisplacementThreshold: 0.001,
  restSpeedThreshold: 0.001,
};

enum CONTEXT_MENU_STATE {
  UNDETERMINED = 0,
  ACTIVE,
  END,
}

const { height: WINDOW_HEIGHT, width: WINDOW_WIDTH } = Dimensions.get("screen");

const MENU_CONTAINER_WIDTH = 100;
const MENU_WIDTH = (WINDOW_WIDTH * 60) / 100;

const MENU_TRANSFORM_ORIGIN_TOLERENCE = 10;

const IS_IOS = Platform.OS === "ios";

const FONT_SCALE = Dimensions.get("screen").fontScale;

export {
  CONTEXT_MENU_STATE,
  WINDOW_HEIGHT,
  WINDOW_WIDTH,
  MENU_WIDTH,
  MENU_CONTAINER_WIDTH,
  HOLD_ITEM_TRANSFORM_DURATION,
  HOLD_ITEM_SCALE_DOWN_VALUE,
  HOLD_ITEM_SCALE_DOWN_DURATION,
  SPRING_CONFIGURATION,
  SPRING_CONFIGURATION_MENU,
  MENU_TRANSFORM_ORIGIN_TOLERENCE,
  IS_IOS,
  FONT_SCALE,
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

export const BACKDROP_LIGHT_BACKGROUND_COLOR = IS_IOS
  ? "rgba(0,0,0,0.2)"
  : "rgba(19, 19, 19, 0.95)";
export const BACKDROP_DARK_BACKGROUND_COLOR = IS_IOS
  ? "rgba(0,0,0,0.75)"
  : "rgba(0,0,0,0.95)";
export const BORDER_LIGHT_COLOR = "rgba(0, 0, 0, 0.1)";
export const BORDER_DARK_COLOR = "rgba(255, 255, 255, 0.1)";

export const MENU_TITLE_COLOR = "gray";
export const MENU_TEXT_LIGHT_COLOR = "rgba(0, 0, 0, 1)";
export const MENU_TEXT_DARK_COLOR = "rgb(255, 255, 255)";

export const MENU_TEXT_DESTRUCTIVE_COLOR_LIGHT = "rgb(255, 59,48)";
export const MENU_TEXT_DESTRUCTIVE_COLOR_DARK = "rgb(255, 69,58)";
