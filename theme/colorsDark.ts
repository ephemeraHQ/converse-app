// TODO: write documentation for colors and palette in own markdown file and add links from here

import { Platform } from "react-native";

import { IColors } from "./colors";

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

const palette = {
  neutral100: "#000000",
  neutral200: "#191015",
  neutral300: "#3C3836",
  neutral400: "#564E4A",
  neutral500: "#978F8A",
  neutral600: "#B6ACA6",
  neutral700: "#D7CEC9",
  neutral800: "#F4F2F1",
  neutral900: "#FFFFFF",

  primary100: "#A54F31",
  primary200: "#C76542",
  primary300: "#D28468",
  primary400: "#DDA28E",
  primary500: "#E8C1B4",
  primary600: "#F4E0D9",

  secondary100: "#41476E",
  secondary200: "#626894",
  secondary300: "#9196B9",
  secondary400: "#BCC0D6",
  secondary500: "#DCDDE9",

  accent100: "#FFBB50",
  accent200: "#FBC878",
  accent300: "#FDD495",
  accent400: "#FFE1B2",
  accent500: "#FFEED4",

  angry100: "#C03403",
  angry500: "#F2D6CD",

  overlay20: "rgba(230, 239, 234, 0.2)",
  overlay50: "rgba(230, 239, 234, 0.5)",
} as const;

export const colorsDark: IColors = {
  transparent: "rgba(0, 0, 0, 0)",
  text: palette.neutral800,
  textDim: palette.neutral600,
  background: Platform.select({
    android: MaterialDarkColors.surface,
    ios: "#111111",
    default: "#111111",
  }),
  border: palette.neutral400,
  tint: palette.primary500,
  separator: palette.neutral300,
  error: palette.angry500,
  errorBackground: palette.angry100,
};
