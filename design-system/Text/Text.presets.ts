import { TextStyle } from "react-native";

import {
  $textBaseStyle,
  $textFontWeightStyles,
  $textSizeStyles,
} from "./Text.styles";
import { ThemedStyleArray } from "../../theme/useAppTheme";

export type IPresets =
  | "body"
  | "bodyBold"
  | "small"
  | "smaller"
  | "smallerBold"
  | "bigBold";

export const textPresets: Record<IPresets, ThemedStyleArray<TextStyle>> = {
  body: [$textBaseStyle],

  bodyBold: [$textBaseStyle, $textFontWeightStyles.bold],

  small: [$textBaseStyle, $textSizeStyles.sm],

  smaller: [$textBaseStyle, $textSizeStyles.xs],

  smallerBold: [$textBaseStyle, $textSizeStyles.xs, $textFontWeightStyles.bold],

  bigBold: [$textBaseStyle, $textSizeStyles.md, $textFontWeightStyles.bold],
};
