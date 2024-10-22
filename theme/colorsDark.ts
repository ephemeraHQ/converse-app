import { IColors } from "./colorsLight";
import { darkPalette, lightPalette } from "./palette";

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
    danger: darkPalette.danger,
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
    scrim: darkPalette.scrim,
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
};
