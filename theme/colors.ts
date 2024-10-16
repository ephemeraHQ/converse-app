import { Platform } from "react-native";

// Generated using https://callstack.github.io/react-native-paper/docs/guides/theming#theme-properties
export const MaterialLightColors = {
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

export const palette = {
  primary: "#000000",
  shade98: "#FAFAFA",
  shade96: "#F5F5F5",
  shade60: "#999999",
  shade30: "#4D4D4D",
  shade15: "#333333",
  shade8: "#141414",

  alpha15: "rgba(0, 0, 0, 0.15)",
  alpha8: "rgba(0, 0, 0, 0.08)",

  edge: "rgba(0, 0, 0, 0.15)",

  danger: "#FF3B30",

  // // Neutral colors - used for backgrounds, borders, and text
  // neutral100: "#FFFFFF",
  // neutral200: "#F4F2F1",
  // neutral300: "#D7CEC9",
  // neutral400: "#B6ACA6",
  // neutral500: "#978F8A",
  // neutral600: "#564E4A",
  // neutral700: "#3C3836",
  // neutral800: "#191015",
  // neutral900: "#000000",

  // // Primary colors - used for main UI elements and call-to-action buttons
  // primary100: "#F4E0D9",
  // primary200: "#E8C1B4",
  // primary300: "#DDA28E",
  // primary400: "#D28468",
  // primary500: "#C76542",
  // primary600: "#A54F31",

  // // Secondary colors - used for secondary UI elements and accents
  // secondary100: "#DCDDE9",
  // secondary200: "#BCC0D6",
  // secondary300: "#9196B9",
  // secondary400: "#626894",
  // secondary500: "#41476E",

  // // Accent colors - used for highlighting and drawing attention
  // accent100: "#FFEED4",
  // accent200: "#FFE1B2",
  // accent300: "#FDD495",
  // accent400: "#FBC878",
  // accent500: "#FFBB50",

  // // Error colors - used for error states and warnings
  // angry100: "#F2D6CD",
  // angry500: "#C03403",

  // // Overlay colors - used for modal backgrounds and dimming effects
  // overlay20: "rgba(25, 16, 21, 0.2)",
  // overlay50: "rgba(25, 16, 21, 0.5)",
};

export const colors = {
  palette,
  transparent: Platform.select({
    android: MaterialLightColors.background,
    default: "rgba(0, 0, 0, 0)",
  }),
  text: Platform.select({
    android: MaterialLightColors.onBackground,
    default: palette.shade8,
  }),
  textDim: Platform.select({
    android: MaterialLightColors.onSurfaceVariant,
    default: palette.shade60,
  }),
  background: Platform.select({
    android: MaterialLightColors.background,
    default: palette.shade98,
  }),
  border: Platform.select({
    android: MaterialLightColors.outline,
    default: palette.shade30,
  }),
  tint: Platform.select({
    android: MaterialLightColors.primary,
    default: palette.primary,
  }),
  separator: Platform.select({
    android: MaterialLightColors.outlineVariant,
    default: palette.shade30,
  }),
  error: Platform.select({
    android: MaterialLightColors.error,
    default: palette.danger,
  }),

  /**
   * Old ones. Maybe need to rename/adjust them.
   */
  navigationSecondaryBackground: Platform.select({
    android: MaterialLightColors.surfaceVariant,
    default: "#F9F9F9",
  }),
  textPrimary: Platform.select({
    android: MaterialLightColors.onBackground,
    default: "#000",
  }),
  textSecondary: Platform.select({
    android: MaterialLightColors.onSurfaceVariant,
    default: "#666",
  }),
  actionSecondary: Platform.select({
    android: MaterialLightColors.secondaryContainer,
    default: "rgba(60, 60, 67, 0.3)",
  }),
  clickedItemBackground: Platform.select({
    android: MaterialLightColors.surfaceVariant,
    default: "#D1D1D5",
  }),
  listItemSeparator: Platform.select({
    android: MaterialLightColors.outlineVariant,
    default: "#b2b2b2",
  }),
  itemSeparator: Platform.select({
    android: MaterialLightColors.outlineVariant,
    default: "#D1D1D5",
  }),
  messageBubble: Platform.select({
    android: MaterialLightColors.surfaceVariant,
    default: "#E9E9EB",
  }),
  messageInnerBubble: Platform.select({
    android: MaterialLightColors.surface,
    default: "rgba(255, 255, 255, 0.6)",
  }),
  messageHighlightedBubbleColor: Platform.select({
    android: "#e7cbce",
    default: "#c9c9cf",
  }),
  myMessageBubble: Platform.select({
    android: MaterialLightColors.primary,
    default: "#000",
  }),
  myMessageInnerBubble: Platform.select({
    android: MaterialLightColors.primaryContainer,
    default: "rgba(255, 255, 255, 0.3)",
  }),
  tertiaryBackground: Platform.select({
    android: MaterialLightColors.tertiaryContainer,
    default: "#EFEFF0",
  }),
  requestsText: Platform.select({
    android: MaterialLightColors.tertiary,
    default: "rgba(126, 0, 204, 1)",
  }),
  badge: Platform.select({
    android: MaterialLightColors.primary,
    default: palette.primary,
  }),
};

export type IColorsKey = keyof typeof colors;

export type IColors = { [key in IColorsKey]: string };
