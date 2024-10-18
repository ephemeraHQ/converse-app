import { TextStyle } from "react-native";

import {
  textBaseStyle,
  textFontWeightStyles,
  textSizeStyles,
} from "./Text.styles";
import { ThemedStyleArray } from "../../theme/useAppTheme";

export type IPresets =
  | "default"
  | "bold"
  | "heading"
  | "subheading"
  | "formLabel"
  | "formHelper"
  | "bigBold";

export const presets: Record<IPresets, ThemedStyleArray<TextStyle>> = {
  default: [textBaseStyle],

  bold: [textBaseStyle, textFontWeightStyles.bold],

  heading: [textBaseStyle, textSizeStyles.xxl, textFontWeightStyles.semiBold],

  subheading: [textBaseStyle, textSizeStyles.sm, textFontWeightStyles.light],

  formLabel: [textBaseStyle, textFontWeightStyles.medium],

  formHelper: [textBaseStyle, textSizeStyles.sm, textFontWeightStyles.normal],

  bigBold: [textBaseStyle, textSizeStyles.lg, textFontWeightStyles.bold],
};
