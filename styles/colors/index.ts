import { ColorSchemeName, Platform } from "react-native";
import { MD3DarkTheme, MD3LightTheme } from "react-native-paper";

const BACKGROUND_LIGHT = "#FFF";
const BACKGROUND_DARK = "#111";

export const backgroundColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark")
    return Platform.OS === "android"
      ? MaterialDarkColors.surface
      : BACKGROUND_DARK;
  return Platform.OS === "android"
    ? MaterialLightColors.surface
    : BACKGROUND_LIGHT;
};

const NAVIGATION_SECONDARY_BACKGROUND_LIGHT = "#F9F9F9";
const NAVIGATION_SECONDARY_BACKGROUND_DARK = "#1C1C1E";

export const navigationSecondaryBackgroundColor = (
  colorScheme: ColorSchemeName
) => {
  if (colorScheme === "dark")
    return Platform.OS === "android" || Platform.OS === "web"
      ? backgroundColor(colorScheme)
      : NAVIGATION_SECONDARY_BACKGROUND_DARK;
  return Platform.OS === "android" || Platform.OS === "web"
    ? backgroundColor(colorScheme)
    : NAVIGATION_SECONDARY_BACKGROUND_LIGHT;
};

export const chatInputBackgroundColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark")
    return Platform.OS === "android" || Platform.OS === "web"
      ? MaterialDarkColors.surfaceVariant
      : NAVIGATION_SECONDARY_BACKGROUND_DARK;
  return Platform.OS === "android" || Platform.OS === "web"
    ? MaterialLightColors.surfaceVariant
    : NAVIGATION_SECONDARY_BACKGROUND_LIGHT;
};

const TEXT_PRIMARY_COLOR_LIGHT = "#000";
const TEXT_PRIMARY_COLOR_DARK = "#FFF";

export const textPrimaryColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark")
    return Platform.OS === "android" || Platform.OS === "web"
      ? MaterialDarkColors.onBackground
      : TEXT_PRIMARY_COLOR_DARK;
  return Platform.OS === "android" || Platform.OS === "web"
    ? MaterialLightColors.onBackground
    : TEXT_PRIMARY_COLOR_LIGHT;
};

const TEXT_SECONDARY_COLOR_LIGHT = "rgba(0, 0, 0, 0.6)";
const TEXT_SECONDARY_COLOR_DARK = "rgba(235, 235, 245, 0.6)";

export const textSecondaryColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark")
    return Platform.OS === "android" || Platform.OS === "web"
      ? MaterialDarkColors.onSurfaceVariant
      : TEXT_SECONDARY_COLOR_DARK;
  return Platform.OS === "android" || Platform.OS === "web"
    ? MaterialLightColors.onSurfaceVariant
    : TEXT_SECONDARY_COLOR_LIGHT;
};

const ACTION_SECONDARY_COLOR_LIGHT = "rgba(60, 60, 67, 0.3)";
const ACTION_SECONDARY_COLOR_DARK = "rgba(235, 235, 245, 0.3)";

export const actionSecondaryColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark") return ACTION_SECONDARY_COLOR_DARK;
  return ACTION_SECONDARY_COLOR_LIGHT;
};

const CLICKED_ITEM_BACKGROUND_LIGHT = "#D1D1D5";
const CLICKED_ITEM_BACKGROUND_DARK = "#3A3A3B";

export const clickedItemBackgroundColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark") return CLICKED_ITEM_BACKGROUND_DARK;
  return CLICKED_ITEM_BACKGROUND_LIGHT;
};

const LIST_ITEM_SEPARATOR_LIGHT = "#b2b2b2";
const LIST_ITEM_SEPARATOR_DARK = "#3A3A3B";

export const listItemSeparatorColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark") return LIST_ITEM_SEPARATOR_DARK;
  return LIST_ITEM_SEPARATOR_LIGHT;
};

const ITEM_SEPARATOR_LIGHT = "#D1D1D5";
const ITEM_SEPARATOR_DARK = "#3A3A3B";

export const itemSeparatorColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark")
    return Platform.OS === "android" || Platform.OS === "web"
      ? MaterialDarkColors.outline
      : ITEM_SEPARATOR_DARK;
  return Platform.OS === "android" || Platform.OS === "web"
    ? MaterialLightColors.outline
    : ITEM_SEPARATOR_LIGHT;
};

const MESSAGE_BUBBLE_LIGHT = "#E9E9EB";
const MESSAGE_BUBBLE_DARK = "#464648";

export const messageBubbleColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark")
    return Platform.OS === "android" || Platform.OS === "web"
      ? MaterialDarkColors.surfaceVariant
      : MESSAGE_BUBBLE_DARK;
  return Platform.OS === "android" || Platform.OS === "web"
    ? MaterialLightColors.surfaceVariant
    : MESSAGE_BUBBLE_LIGHT;
};

const MESSAGE_INNER_BUBBLE_LIGHT = "rgba(255, 255, 255, 0.6)";
const MESSAGE_INNER_BUBBLE_DARK = "rgba(235, 235, 245, 0.3)";

export const messageInnerBubbleColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark")
    return Platform.OS === "android" || Platform.OS === "web"
      ? MaterialDarkColors.inverseOnSurface
      : MESSAGE_INNER_BUBBLE_DARK;
  return Platform.OS === "android" || Platform.OS === "web"
    ? MaterialLightColors.inverseSurface
    : MESSAGE_INNER_BUBBLE_LIGHT;
};

export const messageHighlightedBubbleColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark")
    return Platform.OS === "android" || Platform.OS === "web"
      ? "#574642"
      : "#3e3e41";
  return Platform.OS === "android" || Platform.OS === "web"
    ? "#e7cbce"
    : "#c9c9cf";
};

const MY_MESSAGE_BUBBLE_LIGHT = "#000";
const MY_MESSAGE_BUBBLE_DARK = "#FFF";

export const myMessageBubbleColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark") return MY_MESSAGE_BUBBLE_DARK;
  return MY_MESSAGE_BUBBLE_LIGHT;
};

const MY_MESSAGE_INNER_BUBBLE_LIGHT = "rgba(255, 255, 255, 0.3)";
const MY_MESSAGE_INNER_BUBBLE_DARK = "rgba(0, 0, 0, 0.08)";

export const myMessageInnerBubbleColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark") return MY_MESSAGE_INNER_BUBBLE_DARK;
  return MY_MESSAGE_INNER_BUBBLE_LIGHT;
};

export const myMessageHighlightedBubbleColor = (
  colorScheme: ColorSchemeName
) => {
  return "#b4402f";
};

const TERTIARY_BACKGROUND_LIGHT = "#EFEFF0";
const TERTIARY_BACKGROUND_DARK = "#1C1C1F";

export const tertiaryBackgroundColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark") return TERTIARY_BACKGROUND_DARK;
  return TERTIARY_BACKGROUND_LIGHT;
};

export const primaryColor = (colorScheme: ColorSchemeName) => {
  if (Platform.OS === "ios") {
    if (colorScheme === "dark") {
      return "#FFF";
    } else {
      return "#000";
    }
  }
  if (Platform.OS === "android" || Platform.OS === "web") {
    if (colorScheme === "dark") {
      return MaterialDarkColors.primary;
    } else {
      return MaterialLightColors.primary;
    }
  }
};

export const inversePrimaryColor = (colorScheme: ColorSchemeName) => {
  if (Platform.OS === "android" || Platform.OS === "web") {
    if (colorScheme === "dark") {
      return MaterialLightColors.primary;
    } else {
      return MaterialDarkColors.primary;
    }
  }
  return colorScheme === "dark" ? "#000" : "#FFF";
};

export const badgeColor = (colorScheme: ColorSchemeName) => {
  if (Platform.OS === "android" || Platform.OS === "web") {
    return "#004692";
  }
  return primaryColor(colorScheme);
};

export const dangerColor = (colorScheme: ColorSchemeName) => {
  if (Platform.OS === "android" || Platform.OS === "web") {
    if (colorScheme === "dark") {
      return MaterialDarkColors.error;
    } else {
      return MaterialLightColors.error;
    }
  }
  return colorScheme === "dark" ? "#FF453A" : "#FF3B30";
};

const REQUESTS_TEXT_LIGHT = "rgba(126, 0, 204, 1)";
const REQUESTS_TEXT_DARK = "rgba(126, 0, 204, 1)";

export const requestsTextColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark") return REQUESTS_TEXT_DARK;
  return REQUESTS_TEXT_LIGHT;
};

// Generated using https://callstack.github.io/react-native-paper/docs/guides/theming#theme-properties

const MaterialLightColors = {
  primary: "rgb(135, 44, 204)",
  onPrimary: "rgb(255, 255, 255)",
  primaryContainer: "rgb(242, 218, 255)",
  onPrimaryContainer: "rgb(46, 0, 78)",
  secondary: "rgb(102, 90, 110)",
  onSecondary: "rgb(255, 255, 255)",
  secondaryContainer: "rgb(238, 221, 246)",
  onSecondaryContainer: "rgb(33, 24, 41)",
  tertiary: "rgb(0, 103, 128)",
  onTertiary: "rgb(255, 255, 255)",
  tertiaryContainer: "rgb(183, 234, 255)",
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
  onSurfaceVariant: "rgb(75, 69, 77)",
  outline: "rgb(124, 117, 126)",
  outlineVariant: "rgb(205, 196, 206)",
  shadow: "rgb(0, 0, 0)",
  scrim: "rgb(0, 0, 0)",
  inverseSurface: "rgb(50, 47, 51)",
  inverseOnSurface: "rgb(246, 239, 243)",
  inversePrimary: "rgb(224, 182, 255)",
  elevation: {
    level0: "transparent",
    level1: "rgb(249, 241, 252)",
    level2: "rgb(245, 234, 251)",
    level3: "rgb(242, 228, 249)",
    level4: "rgb(241, 226, 249)",
    level5: "rgb(238, 222, 248)",
  },
  surfaceDisabled: "rgba(29, 27, 30, 0.12)",
  onSurfaceDisabled: "rgba(29, 27, 30, 0.38)",
  backdrop: "rgba(52, 46, 55, 0.4)",
};

const MaterialDarkColors = {
  primary: "rgb(224, 182, 255)",
  onPrimary: "rgb(75, 0, 125)",
  primaryContainer: "rgb(107, 0, 175)",
  onPrimaryContainer: "rgb(242, 218, 255)",
  secondary: "rgb(209, 193, 217)",
  onSecondary: "rgb(55, 44, 63)",
  secondaryContainer: "rgb(78, 66, 86)",
  onSecondaryContainer: "rgb(238, 221, 246)",
  tertiary: "rgb(93, 213, 252)",
  onTertiary: "rgb(0, 53, 68)",
  tertiaryContainer: "rgb(0, 77, 97)",
  onTertiaryContainer: "rgb(183, 234, 255)",
  error: "rgb(255, 180, 171)",
  onError: "rgb(105, 0, 5)",
  errorContainer: "rgb(147, 0, 10)",
  onErrorContainer: "rgb(255, 180, 171)",
  background: "rgb(0, 0, 0)",
  onBackground: "rgb(231, 225, 229)",
  surface: "rgb(0, 0, 0)",
  onSurface: "rgb(231, 225, 229)",
  surfaceVariant: "rgb(28, 28, 30)",
  onSurfaceVariant: "rgb(205, 196, 206)",
  outline: "rgb(150, 142, 152)",
  outlineVariant: "rgb(28, 28, 30)",
  shadow: "rgb(0, 0, 0)",
  scrim: "rgb(0, 0, 0)",
  inverseSurface: "rgb(231, 225, 229)",
  inverseOnSurface: "rgb(50, 47, 51)",
  inversePrimary: "rgb(135, 44, 204)",
  elevation: {
    level0: "transparent",
    level1: "rgb(39, 35, 41)",
    level2: "rgb(45, 39, 48)",
    level3: "rgb(50, 44, 55)",
    level4: "rgb(52, 46, 57)",
    level5: "rgb(56, 49, 62)",
  },
  surfaceDisabled: "rgba(231, 225, 229, 0.12)",
  onSurfaceDisabled: "rgba(231, 225, 229, 0.38)",
  backdrop: "rgba(52, 46, 55, 0.4)",
};

export const MaterialLightTheme = {
  ...MD3LightTheme,
  colors: MaterialLightColors,
};

export const MaterialDarkTheme = {
  ...MD3DarkTheme,
  colors: MaterialDarkColors,
};

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
    web: {
      color: textPrimaryColor(colorScheme),
      fontSize: 17,
      fontWeight: "600" as any,
    },
  });

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

export const actionSheetColors = (colorScheme: ColorSchemeName) =>
  Platform.OS === "android" || Platform.OS === "web"
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
