import { Platform, TextStyle } from "react-native"

export const customFontsToLoad = {}

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
}

export const typography = {
  /**
   * The primary font. Used in most places.
   */
  primary: Platform.select({
    ios: fonts.sfPro,
    android: fonts.roboto,
    default: fonts.sfPro,
  }),
}

/**
 *  
.inviteThem {
text-decoration: underline;
}
.doYouHaveContainer {
font-size: 14px;
line-height: 18px;
color: #666;
height: 18px;
font-family: 'SF Pro';
}
 */

export type ITypography = typeof typography
