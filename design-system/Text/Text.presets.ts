import { TextStyle } from "react-native";

import { $baseStyle, $fontWeightStyles, $sizeStyles } from "./Text.styles";
import { ThemedStyleArray } from "../../theme/useAppTheme";

export type IPresets =
  | "default"
  | "bold"
  | "heading"
  | "subheading"
  | "formLabel"
  | "formHelper";

export const $presets: Record<IPresets, ThemedStyleArray<TextStyle>> = {
  default: [$baseStyle],

  bold: [$baseStyle, $fontWeightStyles.bold],

  heading: [$baseStyle, $sizeStyles.xxl, $fontWeightStyles.semiBold],

  subheading: [$baseStyle, $sizeStyles.sm, $fontWeightStyles.light],

  formLabel: [$baseStyle, $fontWeightStyles.medium],

  formHelper: [$baseStyle, $sizeStyles.sm, $fontWeightStyles.normal],
};
