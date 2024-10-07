import { StyleProp, TextStyle } from "react-native";

import { $baseStyle, $fontWeightStyles, $sizeStyles } from "./Text.styles";

export const $presets = {
  default: $baseStyle,

  bold: [$baseStyle, $fontWeightStyles.bold] as StyleProp<TextStyle>,

  heading: [
    $baseStyle,
    $sizeStyles.xxl,
    $fontWeightStyles.semiBold,
  ] as StyleProp<TextStyle>,

  subheading: [
    $baseStyle,
    $sizeStyles.sm,
    $fontWeightStyles.light,
  ] as StyleProp<TextStyle>,

  formLabel: [$baseStyle, $fontWeightStyles.medium] as StyleProp<TextStyle>,

  formHelper: [
    $baseStyle,
    $sizeStyles.sm,
    $fontWeightStyles.normal,
  ] as StyleProp<TextStyle>,
};
