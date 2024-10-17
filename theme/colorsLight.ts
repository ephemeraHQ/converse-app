import { Platform } from "react-native";

import { darkPalette, lightPalette, MaterialLightColors } from "./palette";

export const colorsLight = {
  bubbles: {
    bubble: darkPalette.dark4,
    bubbleAccent: lightPalette.accent,
    reply: darkPalette.dark4,
    nestedReply: lightPalette.alpha15,
    received: {
      bubble: darkPalette.dark4,
      reply: darkPalette.dark4,
      nestedReply: lightPalette.light,
    },
  },
  border: {
    primary: darkPalette.dark,
    secondary: darkPalette.dark30,
    subtle: darkPalette.dark8,
    edge: lightPalette.alpha4,
    inverted: {
      primary: lightPalette.light,
      secondary: lightPalette.light15,
      subtle: lightPalette.light15,
      edge: lightPalette.alpha8,
    },
  },
  fill: {
    primary: darkPalette.dark,
    secondary: darkPalette.dark60,
    tertiary: darkPalette.dark30,
    minimal: darkPalette.dark4,
    accent: lightPalette.accent,
    inverted: {
      primary: lightPalette.light,
      secondary: lightPalette.light60,
      tertiary: lightPalette.light30,
      minimal: lightPalette.light8,
    },
  },
  background: {
    surface: lightPalette.light,
    sunken: lightPalette.light96,
    raised: lightPalette.light,
  },
  text: {
    primary: darkPalette.dark,
    secondary: darkPalette.dark60,
    tertiary: darkPalette.dark30,
    inactive: darkPalette.dark15,
    inverted: {
      primary: lightPalette.light,
      secondary: lightPalette.light60,
      tertiary: lightPalette.light30,
      inactive: lightPalette.light15,
    },
  },
  global: {
    primary: lightPalette.light,
    primaryAlpha60: lightPalette.alpha60,
    danger: lightPalette.danger,
    inverted: {
      primary: darkPalette.dark,
      primaryAlpha60: darkPalette.alpha60,
    },
  },

  /**
   * Old ones. Maybe need to rename/adjust them.
   */
  navigationSecondaryBackground: Platform.select({
    android: MaterialLightColors.surfaceVariant,
    default: lightPalette.light96,
  }),
  textPrimary: Platform.select({
    android: MaterialLightColors.onBackground,
    default: lightPalette.light8,
  }),
  textSecondary: Platform.select({
    android: MaterialLightColors.onSurfaceVariant,
    default: lightPalette.light60,
  }),
  actionSecondary: Platform.select({
    android: MaterialLightColors.secondaryContainer,
    default: "rgba(60, 60, 67, 0.3)",
  }),
  clickedItemBackground: Platform.select({
    android: MaterialLightColors.surfaceVariant,
    default: lightPalette.light30,
  }),
  listItemSeparator: Platform.select({
    android: MaterialLightColors.outlineVariant,
    default: lightPalette.light30,
  }),
  itemSeparator: Platform.select({
    android: MaterialLightColors.outlineVariant,
    default: lightPalette.light30,
  }),
  messageBubble: Platform.select({
    android: MaterialLightColors.surfaceVariant,
    default: lightPalette.light96,
  }),
  messageInnerBubble: Platform.select({
    android: MaterialLightColors.surface,
    default: "rgba(255, 255, 255, 0.6)",
  }),
  messageHighlightedBubbleColor: Platform.select({
    android: "#e7cbce",
    default: lightPalette.light30,
  }),
  myMessageBubble: Platform.select({
    android: MaterialLightColors.primary,
    default: lightPalette.light8,
  }),
  myMessageInnerBubble: Platform.select({
    android: MaterialLightColors.primaryContainer,
    default: "rgba(255, 255, 255, 0.3)",
  }),
  tertiaryBackground: Platform.select({
    android: MaterialLightColors.tertiaryContainer,
    default: lightPalette.light96,
  }),
  requestsText: Platform.select({
    android: MaterialLightColors.tertiary,
    default: "rgba(126, 0, 204, 1)",
  }),
  badge: Platform.select({
    android: MaterialLightColors.primary,
    default: lightPalette.light,
  }),
} as const;

export type IColorsKey = keyof typeof colorsLight;

export type IColors = typeof colorsLight;
