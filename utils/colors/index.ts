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
      ? MaterialDarkColors.surface1
      : NAVIGATION_SECONDARY_BACKGROUND_DARK;
  return Platform.OS === "android" || Platform.OS === "web"
    ? MaterialLightColors.surface1
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

const TEXT_SECONDARY_COLOR_LIGHT = "rgba(60, 60, 67, 0.6)";
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
const MESSAGE_BUBBLE_DARK = "#262628";

export const messageBubbleColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark")
    return Platform.OS === "android" || Platform.OS === "web"
      ? MaterialDarkColors.surface2
      : MESSAGE_BUBBLE_DARK;
  return Platform.OS === "android" || Platform.OS === "web"
    ? MaterialLightColors.surface2
    : MESSAGE_BUBBLE_LIGHT;
};

const MY_MESSAGE_BUBBLE_LIGHT = "#E95C43";
const MY_MESSAGE_BUBBLE_DARK = "#E95C43";

export const myMessageBubbleColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark") return MY_MESSAGE_BUBBLE_DARK;
  return MY_MESSAGE_BUBBLE_LIGHT;
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
      return "#0A84FF";
    } else {
      return "#007AFF";
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

export const badgeColor = (colorScheme: ColorSchemeName) => {
  if (Platform.OS === "android" || Platform.OS === "web") {
    if (colorScheme === "dark") {
      return MaterialDarkColors.error;
    } else {
      return MaterialLightColors.error;
    }
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

// Generated using https://callstack.github.io/react-native-paper/docs/guides/theming#theme-properties

const MaterialLightColors = {
  primary: "rgb(156, 66, 53)",
  onPrimary: "rgb(255, 255, 255)",
  primaryContainer: "rgb(255, 218, 212)",
  onPrimaryContainer: "rgb(64, 2, 0)",
  secondary: "rgb(119, 86, 81)",
  onSecondary: "rgb(255, 255, 255)",
  secondaryContainer: "rgb(255, 218, 212)",
  onSecondaryContainer: "rgb(44, 21, 17)",
  tertiary: "rgb(111, 92, 46)",
  onTertiary: "rgb(255, 255, 255)",
  tertiaryContainer: "rgb(250, 224, 166)",
  onTertiaryContainer: "rgb(37, 26, 0)",
  error: "rgb(186, 26, 26)",
  onError: "rgb(255, 255, 255)",
  errorContainer: "rgb(255, 218, 214)",
  onErrorContainer: "rgb(65, 0, 2)",
  background: "rgb(255, 251, 255)",
  onBackground: "rgb(32, 26, 25)",
  surface: "rgb(255, 251, 255)",
  surface1: "rgb(251, 242, 245)",
  surface2: "rgb(247, 236, 239)",
  onSurface: "rgb(32, 26, 25)",
  surfaceVariant: "rgb(245, 221, 217)",
  onSurfaceVariant: "rgb(83, 67, 64)",
  outline: "rgb(133, 115, 112)",
  outlineVariant: "rgb(216, 194, 190)",
  shadow: "rgb(0, 0, 0)",
  scrim: "rgb(0, 0, 0)",
  inverseSurface: "rgb(54, 47, 45)",
  inverseOnSurface: "rgb(251, 238, 235)",
  inversePrimary: "rgb(255, 180, 167)",
  elevation: {
    level0: "transparent",
    level1: "rgb(252, 240, 243)",
    level2: "rgb(249, 233, 236)",
    level3: "rgb(247, 227, 228)",
    level4: "rgb(247, 225, 226)",
    level5: "rgb(245, 220, 221)",
  },
  surfaceDisabled: "rgba(32, 26, 25, 0.12)",
  onSurfaceDisabled: "rgba(32, 26, 25, 0.38)",
  backdrop: "rgba(59, 45, 43, 0.4)",
};

const MaterialDarkColors = {
  primary: "rgb(255, 180, 167)",
  onPrimary: "rgb(103, 5, 0)",
  primaryContainer: "rgb(145, 10, 0)",
  onPrimaryContainer: "rgb(255, 218, 212)",
  secondary: "rgb(231, 189, 181)",
  onSecondary: "rgb(68, 42, 37)",
  secondaryContainer: "rgb(93, 63, 58)",
  onSecondaryContainer: "rgb(255, 218, 212)",
  tertiary: "rgb(221, 196, 140)",
  onTertiary: "rgb(61, 46, 4)",
  tertiaryContainer: "rgb(86, 69, 25)",
  onTertiaryContainer: "rgb(250, 224, 166)",
  error: "rgb(255, 180, 171)",
  onError: "rgb(105, 0, 5)",
  errorContainer: "rgb(147, 0, 10)",
  onErrorContainer: "rgb(255, 180, 171)",
  background: "rgb(32, 26, 25)",
  onBackground: "rgb(237, 224, 221)",
  surface: "rgb(32, 26, 25)",
  surface1: "rgb(44, 34, 32)",
  surface2: "rgb(50, 38, 36)",
  onSurface: "rgb(237, 224, 221)",
  surfaceVariant: "rgb(83, 67, 64)",
  onSurfaceVariant: "rgb(216, 194, 190)",
  outline: "rgb(160, 140, 137)",
  outlineVariant: "rgb(83, 67, 64)",
  shadow: "rgb(0, 0, 0)",
  scrim: "rgb(0, 0, 0)",
  inverseSurface: "rgb(237, 224, 221)",
  inverseOnSurface: "rgb(54, 47, 45)",
  inversePrimary: "rgb(185, 30, 12)",
  elevation: {
    level0: "transparent",
    level1: "rgb(43, 34, 32)",
    level2: "rgb(50, 38, 36)",
    level3: "rgb(57, 43, 41)",
    level4: "rgb(59, 45, 42)",
    level5: "rgb(63, 48, 45)",
  },
  surfaceDisabled: "rgba(237, 224, 221, 0.12)",
  onSurfaceDisabled: "rgba(237, 224, 221, 0.38)",
  backdrop: "rgba(59, 45, 43, 0.4)",
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
