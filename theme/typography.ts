import { Platform, TextStyle } from "react-native";

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
   * The primary font. Used in most places.
   */
  primary: Platform.select({
    ios: fonts.sfPro,
    android: fonts.roboto,
    default: fonts.sfPro,
  }),
};

export const text: Record<string, TextStyle> = {
  body: {
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0,
    fontWeight: 400,
  },
  bodyBold: {
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0,
    fontWeight: 700,
  },
  small: {
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0,
    fontWeight: 400,
  },
  smaller: {
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 0,
    fontWeight: 400,
  },
  smallerBold: {
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 0,
    fontWeight: 700,
  },
  bigBold: {
    fontSize: 24,
    lineHeight: 34,
    letterSpacing: 0,
    fontWeight: 700,
  },
};

export type ITypography = typeof typography;
