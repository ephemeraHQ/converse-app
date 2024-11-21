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
  | "formLabel"
  | "emojiSymbol";

export const textPresets: Record<IPresets, ThemedStyleArray<TextStyle>> = {
  title: [textBaseStyle, textSizeStyles.xl, textFontWeightStyles.bold],

  body: [textBaseStyle],

  bodyBold: [textBaseStyle, textFontWeightStyles.bold],

  small: [textBaseStyle, textSizeStyles.xs],

  smaller: [textBaseStyle, textSizeStyles.xxs],

  smallerBold: [textBaseStyle, textSizeStyles.xxs, textFontWeightStyles.bold],

  bigBold: [textBaseStyle, textSizeStyles.xs, textFontWeightStyles.bold],

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

  emojiSymbol: [textBaseStyle, { fontSize: 22, lineHeight: 28 }],
};
