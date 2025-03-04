import { IColors } from "./colorsLight"
import { darkPalette, lightPalette } from "./palette"

export const colorsDark: IColors = {
  bubbles: {
    bubble: lightPalette.light,
    bubbleAccent: darkPalette.accent,
    reply: lightPalette.light96,
    nestedReply: darkPalette.dark85,
    nestedReplyFromMe: darkPalette.alpha4,
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
    caution: darkPalette.red,
    inverted: {
      primary: darkPalette.dark,
      secondary: darkPalette.dark60,
      tertiary: darkPalette.dark30,
      minimal: darkPalette.dark4,
    },
  },
  background: {
    surface: darkPalette.dark92,
    sunken: darkPalette.dark,
    raised: darkPalette.dark85,
    blurred: darkPalette.alpha90,
    surfaceless: darkPalette.dark,
  },
  text: {
    primary: lightPalette.light,
    secondary: lightPalette.light60,
    tertiary: lightPalette.light30,
    inactive: lightPalette.light15,
    caution: darkPalette.red,
    action: darkPalette.deepAccent,
    inverted: {
      primary: darkPalette.dark,
      secondary: darkPalette.dark60,
      tertiary: darkPalette.dark30,
      inactive: darkPalette.dark15,
      action: darkPalette.deepAccent,
    },
  },
  global: {
    white: lightPalette.light,
    black: darkPalette.dark,
    green: darkPalette.green,
    primary: darkPalette.dark,
    primaryAlpha60: darkPalette.alpha60,
    caution: darkPalette.red,
    transparent: darkPalette.transparent,
    inverted: {
      primary: lightPalette.light,
      primaryAlpha60: lightPalette.alpha60,
    },
  },
}
