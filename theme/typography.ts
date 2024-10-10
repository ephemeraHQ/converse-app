// TODO: write documentation about fonts and typography along with guides on how to add custom fonts in own
// markdown file and add links from here

import { Platform } from "react-native";

export const customFontsToLoad = {};

const fonts = {
  roboto: {
    // Cross-platform Google font.
    light: "Roboto-Light",
    normal: "Roboto-Regular",
    medium: "Roboto-Medium",
    semiBold: "Roboto-SemiBold",
    bold: "Roboto-Bold",
  },
  sfPro: {
    // iOS (post iOS 9) system font.
    thin: "SFProText-Thin",
    light: "SFProText-Light",
    normal: "SFProText-Regular",
    medium: "SFProText-Medium",
    semiBold: "SFProText-Semibold",
    bold: "SFProText-Bold",
  },
  courier: {
    // iOS only font.
    normal: "Courier",
  },
  sansSerif: {
    // Android only font.
    thin: "sans-serif-thin",
    light: "sans-serif-light",
    normal: "sans-serif",
    medium: "sans-serif-medium",
  },
  monospace: {
    // Android only font.
    normal: "monospace",
  },
};

export const typography = {
  /**
   * The fonts are available to use, but prefer using the semantic name.
   */
  fonts,
  /**
   * The primary font. Used in most places.
   */
  primary: Platform.select({
    ios: fonts.sfPro,
    android: fonts.roboto,
    default: fonts.sfPro,
  }),
  /**
   * An alternate font used for perhaps titles and stuff.
   */
  secondary: Platform.select({
    ios: fonts.sfPro,
    android: fonts.sansSerif,
    default: fonts.sfPro,
  }),
};

export type ITypography = typeof typography;
