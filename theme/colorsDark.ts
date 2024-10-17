import { Platform } from "react-native";

import { IColors } from "./colorsLight";
import { darkPalette, lightPalette, MaterialDarkColors } from "./palette";

export const colorsDark: IColors = {
  bubbles: {
    bubble: lightPalette.light15,
    bubbleAccent: darkPalette.accent,
    reply: lightPalette.light96,
    nestedReply: darkPalette.alpha4,
    received: {
      bubble: lightPalette.light15,
      reply: lightPalette.light15,
      nestedReply: darkPalette.dark85,
    },
  },
  border: {
    primary: lightPalette.light,
    secondary: lightPalette.light15,
    subtle: lightPalette.light15,
    edge: darkPalette.alpha8,
    inverted: {
      primary: darkPalette.dark,
      secondary: darkPalette.dark30,
      subtle: darkPalette.dark8,
      edge: darkPalette.alpha4,
    },
  },
  fill: {
    primary: lightPalette.light,
    secondary: lightPalette.light60,
    tertiary: lightPalette.light30,
    minimal: lightPalette.light8,
    accent: darkPalette.accent,
    inverted: {
      primary: darkPalette.dark,
      secondary: darkPalette.dark60,
      tertiary: darkPalette.dark30,
      minimal: darkPalette.dark4,
    },
  },
  background: {
    surface: darkPalette.dark,
    sunken: darkPalette.dark85,
    raised: darkPalette.dark85,
  },
  text: {
    primary: lightPalette.light,
    secondary: lightPalette.light60,
    tertiary: lightPalette.light30,
    inactive: lightPalette.light15,
    inverted: {
      primary: darkPalette.dark,
      secondary: darkPalette.dark60,
      tertiary: darkPalette.dark30,
      inactive: darkPalette.dark15,
    },
  },
  global: {
    primary: darkPalette.dark,
    primaryAlpha60: darkPalette.alpha60,
    danger: darkPalette.danger,
    inverted: {
      primary: lightPalette.light,
      primaryAlpha60: lightPalette.alpha60,
    },
  },

  /**
   * Old ones. Maybe need to rename/adjust them.
   */
  navigationSecondaryBackground: Platform.select({
    android: MaterialDarkColors.surfaceVariant,
    default: "#1C1C1E",
  }),
  textPrimary: Platform.select({
    android: MaterialDarkColors.onBackground,
    default: darkPalette.dark,
  }),
  textSecondary: Platform.select({
    android: MaterialDarkColors.onSurfaceVariant,
    default: darkPalette.dark8,
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
    default: darkPalette.alpha8,
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
    default: darkPalette.dark,
  }),
};
