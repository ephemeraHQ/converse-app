import { TextStyle } from "react-native";

import {
  textBaseStyle,
  textFontWeightStyles,
  textSizeStyles,
} from "./Text.styles";
import { ThemedStyleArray } from "../../theme/useAppTheme";

export type IPresets =
  | "title"
  | "body"
  | "bodyBold"
  | "small"
  | "smaller"
  | "smallerBold"
  | "bigBold"
  | "formHelper"
  | "formLabel";

export const textPresets: Record<IPresets, ThemedStyleArray<TextStyle>> = {
  title: [textBaseStyle, textSizeStyles.xl, textFontWeightStyles.bold],

  body: [textBaseStyle],

  bodyBold: [textBaseStyle, textFontWeightStyles.bold],

  small: [textBaseStyle, textSizeStyles.sm],

  smaller: [textBaseStyle, textSizeStyles.xs],

  smallerBold: [textBaseStyle, textSizeStyles.xs, textFontWeightStyles.bold],

  bigBold: [textBaseStyle, textSizeStyles.md, textFontWeightStyles.bold],

  formHelper: [
    textBaseStyle,
    textSizeStyles.xs,
    ({ colors }) => ({ color: colors.fill.secondary }),
  ],

  formLabel: [
    textBaseStyle,
    textSizeStyles.xs,
    ({ colors }) => ({ color: colors.text.secondary }),
  ],
};
