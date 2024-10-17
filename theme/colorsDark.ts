// TODO: write documentation for colors and palette in own markdown file and add links from here

import { Platform } from "react-native";

import { IColors } from "./colors";

// Generated using https://callstack.github.io/react-native-paper/docs/guides/theming#theme-properties
export const MaterialDarkColors = {
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

export const palette = {
  primary: "#ffffff",
  shade98: "#141414",
  shade96: "#262626",
  shade60: "#666666",
  shade30: "#B2B2B2",
  shade15: "#D9D9D9",
  shade8: "#EBEBEB",

  alpha15: "rgba(0, 0, 0, 0.15)",
  alpha8: "rgba(0, 0, 0, 0.08)",

  edge: "rgba(0, 0, 0, 0.15)",

  danger: "#FF453A",
  // neutral100: "#000000",
  // neutral200: "#191015",
  // neutral300: "#3C3836",
  // neutral400: "#564E4A",
  // neutral500: "#978F8A",
  // neutral600: "#B6ACA6",
  // neutral700: "#D7CEC9",
  // neutral800: "#F4F2F1",
  // neutral900: "#FFFFFF",

  // primary100: "#A54F31",
  // primary200: "#C76542",
  // primary300: "#D28468",
  // primary400: "#DDA28E",
  // primary500: "#E8C1B4",
  // primary600: "#F4E0D9",

  // secondary100: "#41476E",
  // secondary200: "#626894",
  // secondary300: "#9196B9",
  // secondary400: "#BCC0D6",
  // secondary500: "#DCDDE9",

  // accent100: "#FFBB50",
  // accent200: "#FBC878",
  // accent300: "#FDD495",
  // accent400: "#FFE1B2",
  // accent500: "#FFEED4",

  // angry100: "#C03403",
  // angry500: "#F2D6CD",

  // overlay20: "rgba(230, 239, 234, 0.2)",
  // overlay50: "rgba(230, 239, 234, 0.5)",
};

export const colorsDark: IColors = {
  transparent: Platform.select({
    android: MaterialDarkColors.background,
    default: "rgba(0, 0, 0, 0)",
  }),
  text: Platform.select({
    android: MaterialDarkColors.onBackground,
    default: palette.shade8,
  }),
  textDim: Platform.select({
    android: MaterialDarkColors.onSurfaceVariant,
    default: palette.shade60,
  }),
  background: Platform.select({
    android: MaterialDarkColors.surface,
    ios: "#111111",
    default: "#111111",
  }),
  border: Platform.select({
    android: MaterialDarkColors.outline,
    default: palette.shade30,
  }),
  tint: Platform.select({
    android: MaterialDarkColors.primary,
    default: palette.primary,
  }),
  separator: Platform.select({
    android: MaterialDarkColors.outlineVariant,
    default: palette.shade30,
  }),
  error: Platform.select({
    android: MaterialDarkColors.error,
    default: palette.danger,
  }),

  /**
   * Old ones. Maybe need to rename/adjust them.
   */
  navigationSecondaryBackground: Platform.select({
    android: MaterialDarkColors.surfaceVariant,
    default: "#1C1C1E",
  }),
  textPrimary: Platform.select({
    android: MaterialDarkColors.onBackground,
    default: palette.primary,
  }),
  textSecondary: Platform.select({
    android: MaterialDarkColors.onSurfaceVariant,
    default: palette.shade8,
  }),
  actionSecondary: Platform.select({
    android: MaterialDarkColors.secondaryContainer,
    default: "rgba(235, 235, 245, 0.3)",
  }),
  clickedItemBackground: Platform.select({
    android: MaterialDarkColors.surfaceVariant,
    default: "#3A3A3B",
  }),
  listItemSeparator: Platform.select({
    android: MaterialDarkColors.outlineVariant,
    default: "#3A3A3B",
  }),
  itemSeparator: Platform.select({
    android: MaterialDarkColors.outlineVariant,
    default: "#3A3A3B",
  }),
  messageBubble: Platform.select({
    android: MaterialDarkColors.surfaceVariant,
    default: "#464648",
  }),
  messageInnerBubble: Platform.select({
    android: MaterialDarkColors.surface,
    default: "rgba(235, 235, 245, 0.3)",
  }),
  myMessageBubble: Platform.select({
    android: MaterialDarkColors.primary,
    default: "#FFF",
  }),
  messageHighlightedBubbleColor: Platform.select({
    android: "#574642",
    default: "#3e3e41",
  }),
  myMessageInnerBubble: Platform.select({
    android: MaterialDarkColors.primaryContainer,
    default: palette.alpha8,
  }),
  tertiaryBackground: Platform.select({
    android: MaterialDarkColors.tertiaryContainer,
    default: "#1C1C1F",
  }),
  requestsText: Platform.select({
    android: MaterialDarkColors.tertiary,
    default: "rgba(126, 0, 204, 1)",
  }),
  badge: Platform.select({
    android: MaterialDarkColors.primary,
    default: palette.primary,
  }),
};
