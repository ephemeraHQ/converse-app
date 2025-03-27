import { darkPalette, lightPalette } from "./palette"

export const colorsLight = {
  bubbles: {
    bubble: darkPalette.dark,
    bubbleAccent: lightPalette.accent,
    reply: darkPalette.dark4,
    nestedReply: lightPalette.light,
    nestedReplyFromMe: lightPalette.light15,
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
    caution: lightPalette.red,
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
    blurred: lightPalette.alpha90,
    surfaceless: lightPalette.light,
  },
  text: {
    primary: darkPalette.dark,
    secondary: darkPalette.dark60,
    tertiary: darkPalette.dark30,
    inactive: darkPalette.dark15,
    caution: darkPalette.red,
    action: darkPalette.deepAccent,
    inverted: {
      primary: lightPalette.light,
      secondary: lightPalette.light60,
      tertiary: lightPalette.light30,
      inactive: lightPalette.light15,
      action: lightPalette.deepAccent,
    },
  },
  global: {
    white: lightPalette.light,
    black: darkPalette.dark,
    green: lightPalette.green,
    primary: lightPalette.light,
    primaryAlpha60: lightPalette.alpha60,
    caution: lightPalette.red,
    transparent: lightPalette.transparent,
    inverted: {
      primary: darkPalette.dark,
      primaryAlpha60: darkPalette.alpha60,
    },
  },
} as const

export type IColorsKey = keyof typeof colorsLight

export type IColors = typeof colorsLight
