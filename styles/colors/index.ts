import { ColorSchemeName, Platform } from "react-native";
import { MD3DarkTheme, MD3LightTheme } from "react-native-paper";

/** @deprecated */
export const BACKGROUND_LIGHT = "#FFF";
/** @deprecated */
export const BACKGROUND_DARK = "#111";

/** @deprecated */
export const backgroundColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark")
    return Platform.OS === "android"
      ? MaterialDarkColors.surface
      : BACKGROUND_DARK;
  return Platform.OS === "android"
    ? MaterialLightColors.surface
    : BACKGROUND_LIGHT;
};

/** @deprecated */
const NAVIGATION_SECONDARY_BACKGROUND_LIGHT = "#F9F9F9";
/** @deprecated */
const NAVIGATION_SECONDARY_BACKGROUND_DARK = "#1C1C1E";

/** @deprecated */
export const navigationSecondaryBackgroundColor = (
  colorScheme: ColorSchemeName
) => {
  if (colorScheme === "dark")
    return Platform.OS === "android"
      ? backgroundColor(colorScheme)
      : NAVIGATION_SECONDARY_BACKGROUND_DARK;
  return Platform.OS === "android"
    ? backgroundColor(colorScheme)
    : NAVIGATION_SECONDARY_BACKGROUND_LIGHT;
};

/** @deprecated */
export const chatInputBackgroundColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark")
    return Platform.OS === "android"
      ? MaterialDarkColors.surfaceVariant
      : NAVIGATION_SECONDARY_BACKGROUND_DARK;
  return Platform.OS === "android"
    ? MaterialLightColors.surfaceVariant
    : NAVIGATION_SECONDARY_BACKGROUND_LIGHT;
};

/** @deprecated */
export const TEXT_PRIMARY_COLOR_LIGHT = "#000";
/** @deprecated */
export const TEXT_PRIMARY_COLOR_DARK = "#FFF";

/** @deprecated */
export const textPrimaryColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark")
    return Platform.OS === "android"
      ? MaterialDarkColors.onBackground
      : TEXT_PRIMARY_COLOR_DARK;
  return Platform.OS === "android"
    ? MaterialLightColors.onBackground
    : TEXT_PRIMARY_COLOR_LIGHT;
};

/** @deprecated */
const TEXT_SECONDARY_COLOR_LIGHT = "#666";
/** @deprecated */
const TEXT_SECONDARY_COLOR_DARK = "#EBEBEB";

/** @deprecated */
export const textSecondaryColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark")
    return Platform.OS === "android"
      ? MaterialDarkColors.onSurfaceVariant
      : TEXT_SECONDARY_COLOR_DARK;
  return Platform.OS === "android"
    ? MaterialLightColors.onSurfaceVariant
    : TEXT_SECONDARY_COLOR_LIGHT;
};

/** @deprecated */
const ACTION_SECONDARY_COLOR_LIGHT = "rgba(60, 60, 67, 0.3)";
/** @deprecated */
const ACTION_SECONDARY_COLOR_DARK = "rgba(235, 235, 245, 0.3)";

/** @deprecated */
export const actionSecondaryColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark") return ACTION_SECONDARY_COLOR_DARK;
  return ACTION_SECONDARY_COLOR_LIGHT;
};

/** @deprecated */
const CLICKED_ITEM_BACKGROUND_LIGHT = "#D1D1D5";
/** @deprecated */
const CLICKED_ITEM_BACKGROUND_DARK = "#3A3A3B";

/** @deprecated */
export const clickedItemBackgroundColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark") return CLICKED_ITEM_BACKGROUND_DARK;
  return CLICKED_ITEM_BACKGROUND_LIGHT;
};

/** @deprecated */
const LIST_ITEM_SEPARATOR_LIGHT = "#b2b2b2";
/** @deprecated */
const LIST_ITEM_SEPARATOR_DARK = "#3A3A3B";

/** @deprecated */
export const listItemSeparatorColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark") return LIST_ITEM_SEPARATOR_DARK;
  return LIST_ITEM_SEPARATOR_LIGHT;
};

/** @deprecated */
const ITEM_SEPARATOR_LIGHT = "#D1D1D5";
/** @deprecated */
const ITEM_SEPARATOR_DARK = "#3A3A3B";

/** @deprecated */
export const itemSeparatorColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark")
    return Platform.OS === "android"
      ? MaterialDarkColors.outline
      : ITEM_SEPARATOR_DARK;
  return Platform.OS === "android"
    ? MaterialLightColors.outline
    : ITEM_SEPARATOR_LIGHT;
};

/** @deprecated */
const MESSAGE_BUBBLE_LIGHT = "#E9E9EB";
/** @deprecated */
const MESSAGE_BUBBLE_DARK = "#464648";

/** @deprecated */
export const messageBubbleColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark")
    return Platform.OS === "android"
      ? MaterialDarkColors.surfaceVariant
      : MESSAGE_BUBBLE_DARK;
  return Platform.OS === "android"
    ? MaterialLightColors.surfaceVariant
    : MESSAGE_BUBBLE_LIGHT;
};

/** @deprecated */
const MESSAGE_INNER_BUBBLE_LIGHT = "rgba(255, 255, 255, 0.6)";
/** @deprecated */
const MESSAGE_INNER_BUBBLE_DARK = "rgba(235, 235, 245, 0.3)";

/** @deprecated */
export const messageInnerBubbleColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark")
    return Platform.OS === "android"
      ? MaterialDarkColors.inverseOnSurface
      : MESSAGE_INNER_BUBBLE_DARK;
  return Platform.OS === "android"
    ? MaterialLightColors.inverseSurface
    : MESSAGE_INNER_BUBBLE_LIGHT;
};

/** @deprecated */
export const messageHighlightedBubbleColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark")
    return Platform.OS === "android" ? "#574642" : "#3e3e41";
  return Platform.OS === "android" ? "#e7cbce" : "#c9c9cf";
};

/** @deprecated */
const MY_MESSAGE_BUBBLE_LIGHT = "#000";
/** @deprecated */
const MY_MESSAGE_BUBBLE_DARK = "#FFF";

/** @deprecated */
export const myMessageBubbleColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark") return MY_MESSAGE_BUBBLE_DARK;
  return MY_MESSAGE_BUBBLE_LIGHT;
};

/** @deprecated */
const MY_MESSAGE_INNER_BUBBLE_LIGHT = "rgba(255, 255, 255, 0.3)";
/** @deprecated */
const MY_MESSAGE_INNER_BUBBLE_DARK = "rgba(0, 0, 0, 0.08)";

/** @deprecated */
export const myMessageInnerBubbleColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark") return MY_MESSAGE_INNER_BUBBLE_DARK;
  return MY_MESSAGE_INNER_BUBBLE_LIGHT;
};

/** @deprecated */
export const myMessageHighlightedBubbleColor = (
  colorScheme: ColorSchemeName
) => {
  return "#b4402f";
};

/** @deprecated */
const TERTIARY_BACKGROUND_LIGHT = "#EFEFF0";
/** @deprecated */
const TERTIARY_BACKGROUND_DARK = "#1C1C1F";

/** @deprecated */
export const tertiaryBackgroundColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark") return TERTIARY_BACKGROUND_DARK;
  return TERTIARY_BACKGROUND_LIGHT;
};

/** @deprecated */
export const primaryColor = (colorScheme: ColorSchemeName) => {
  if (Platform.OS === "ios") {
    if (colorScheme === "dark") {
      return "#FFF";
    } else {
      return "#000";
    }
  }
  if (Platform.OS === "android") {
    if (colorScheme === "dark") {
      return MaterialDarkColors.primary;
    } else {
      return MaterialLightColors.primary;
    }
  }
};

/** @deprecated */
export const inversePrimaryColor = (colorScheme: ColorSchemeName) => {
  if (Platform.OS === "android") {
    if (colorScheme === "dark") {
      return MaterialLightColors.primary;
    } else {
      return MaterialDarkColors.primary;
    }
  }
  return colorScheme === "dark" ? "#000" : "#FFF";
};

/** @deprecated */
export const badgeColor = (colorScheme: ColorSchemeName) => {
  if (Platform.OS === "android") {
    return "#004692";
  }
  return primaryColor(colorScheme);
};

/** @deprecated */
export const dangerColor = (colorScheme: ColorSchemeName) => {
  if (Platform.OS === "android") {
    if (colorScheme === "dark") {
      return MaterialDarkColors.error;
    } else {
      return MaterialLightColors.error;
    }
  }
  return colorScheme === "dark" ? "#FF453A" : "#FF3B30";
};

/** @deprecated */
const REQUESTS_TEXT_LIGHT = "rgba(126, 0, 204, 1)";
/** @deprecated */
const REQUESTS_TEXT_DARK = "rgba(126, 0, 204, 1)";

/** @deprecated */
export const requestsTextColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark") return REQUESTS_TEXT_DARK;
  return REQUESTS_TEXT_LIGHT;
};

// Generated using https://callstack.github.io/react-native-paper/docs/guides/theming#theme-properties

/** @deprecated */
const MaterialLightColors = {
  primary: "rgb(0,0,0)",
  onPrimary: "rgb(255, 255, 255)",
  primaryContainer: "rgb(0,0,0)",
  onPrimaryContainer: "rgb(255,255,255)",
  secondary: "rgb(102, 102, 102)",
  onSecondary: "rgb(255, 255, 255)",
  secondaryContainer: "rgb(220, 220, 220)",
  onSecondaryContainer: "rgb(33, 33, 33)",
  tertiary: "rgb(75, 75, 75)",
  onTertiary: "rgb(255, 255, 255)",
  tertiaryContainer: "rgb(188, 188, 188)",
  onTertiaryContainer: "rgb(0, 31, 40)",
  error: "rgb(186, 26, 26)",
  onError: "rgb(255, 255, 255)",
  errorContainer: "rgb(255, 218, 214)",
  onErrorContainer: "rgb(65, 0, 2)",
  background: "rgb(255, 255, 255)",
  onBackground: "rgb(0, 0, 0)",
  surface: "rgb(255, 255, 255)",
  onSurface: "rgb(0, 0, 0)",
  surfaceVariant: "rgb(249, 249, 249)",
  onSurfaceVariant: "rgb(75, 75, 75)",
  outline: "rgb(120, 120, 120)",
  outlineVariant: "rgb(205, 205, 205)",
  shadow: "rgb(0, 0, 0)",
  scrim: "rgb(0, 0, 0)",
  inverseSurface: "rgb(50, 50, 50)",
  inverseOnSurface: "rgb(245, 245, 245)",
  inversePrimary: "rgb(255,255,255)",
  elevation: {
    level0: "transparent",
    level1: "rgb(249, 249, 249)",
    level2: "rgb(234, 234, 234)",
    level3: "rgb(228, 228, 228)",
    level4: "rgb(226, 226, 226)",
    level5: "rgb(222, 222, 222)",
  },
  surfaceDisabled: "rgba(29, 27, 30, 0.12)",
  onSurfaceDisabled: "rgba(29, 27, 30, 0.38)",
  backdrop: "rgba(52, 46, 55, 0.4)",
};

/** @deprecated */
const MaterialDarkColors = {
  primary: "rgb(255,255,255)",
  onPrimary: "rgb(0,0,0)",
  primaryContainer: "rgb(255,255,255)",
  onPrimaryContainer: "rgb(0,0,0)",
  secondary: "rgb(209, 209, 209)",
  onSecondary: "rgb(55, 55, 55)",
  secondaryContainer: "rgb(50, 50, 50)",
  onSecondaryContainer: "rgb(238, 238, 238)",
  tertiary: "rgb(93, 213, 252)",
  onTertiary: "rgb(0, 53, 68)",
  tertiaryContainer: "rgb(0, 77, 97)",
  onTertiaryContainer: "rgb(183, 234, 255)",
  error: "rgb(255, 180, 171)",
  onError: "rgb(105, 0, 5)",
  errorContainer: "rgb(147, 0, 10)",
  onErrorContainer: "rgb(255, 180, 171)",
  background: "rgb(0, 0, 0)",
  onBackground: "rgb(229, 229, 229)",
  surface: "rgb(0, 0, 0)",
  onSurface: "rgb(229, 229, 229)",
  surfaceVariant: "rgb(28, 28, 30)",
  onSurfaceVariant: "rgb(205, 196, 206)",
  outline: "rgb(150, 142, 152)",
  outlineVariant: "rgb(28, 28, 30)",
  shadow: "rgb(0, 0, 0)",
  scrim: "rgb(0, 0, 0)",
  inverseSurface: "rgb(231, 225, 229)",
  inverseOnSurface: "rgb(50, 50, 50)",
  inversePrimary: "rgb(0,0,0)",
  elevation: {
    level0: "transparent",
    level1: "rgb(39, 35, 41)",
    level2: "rgb(45, 45, 45)",
    level3: "rgb(50, 50, 50)",
    level4: "rgb(52, 52, 52)",
    level5: "rgb(56, 56, 56)",
  },
  surfaceDisabled: "rgba(231, 225, 229, 0.12)",
  onSurfaceDisabled: "rgba(231, 225, 229, 0.38)",
  backdrop: "rgba(52, 46, 55, 0.4)",
};

/** @deprecated */
export const MaterialLightTheme = {
  ...MD3LightTheme,
  colors: MaterialLightColors,
};

/** @deprecated */
export const MaterialDarkTheme = {
  ...MD3DarkTheme,
  colors: MaterialDarkColors,
};

/** @deprecated */
export const headerTitleStyle = (colorScheme: ColorSchemeName) =>
  Platform.select({
    default: {
      color: textPrimaryColor(colorScheme),
      fontSize: 17,
      fontWeight: "600" as any,
      maxWidth: 150,
    },
    android: {
      color: textPrimaryColor(colorScheme),
      fontSize: 18,
      left: -15,
      fontFamily: "Roboto",
    },
  });

/** @deprecated */
export const rgbStringToHex = (rgbString: string) => {
  const splitted = rgbString.split("(")[1].split(")")[0].split(",");
  const hexValue = splitted
    .map((x: string) => {
      x = parseInt(x, 10).toString(16);
      return x.length === 1 ? "0" + x : x;
    })
    .join("");
  return `#${hexValue}`;
};

/** @deprecated */
export const actionSheetColors = (colorScheme: ColorSchemeName) =>
  Platform.OS === "android"
    ? {
        containerStyle: {
          backgroundColor:
            colorScheme === "dark"
              ? MaterialDarkColors.elevation.level3
              : backgroundColor(colorScheme),
        },
        tintColor: textSecondaryColor(colorScheme),
        titleTextStyle: { color: textSecondaryColor(colorScheme) },
        messageTextStyle: { color: textSecondaryColor(colorScheme) },
      }
    : {};

/** @deprecated */
export const textInputStyle = (colorScheme: ColorSchemeName) =>
  ({
    ...Platform.select({
      default: {
        backgroundColor: tertiaryBackgroundColor(colorScheme),
        borderRadius: 10,
        fontSize: 17,
      },
      android: {
        backgroundColor: backgroundColor(colorScheme),
        borderWidth: 1,
        borderRadius: 4,
        borderColor: textSecondaryColor(colorScheme),
        fontSize: 16,
      },
    }),
    alignContent: "flex-start",
    color: textPrimaryColor(colorScheme),
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 10,
    paddingBottom: 10,
  }) as any;
