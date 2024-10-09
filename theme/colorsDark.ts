// TODO: write documentation for colors and palette in own markdown file and add links from here

import { IColors } from "./colors";

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
  background: palette.neutral100,
  border: palette.neutral400,
  tint: palette.primary500,
  separator: palette.neutral300,
  error: palette.angry500,
  errorBackground: palette.angry100,
};
