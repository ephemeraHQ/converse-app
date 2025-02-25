import { TextStyle } from "react-native";
import { ThemedStyleArray } from "../../theme/use-app-theme";
import {
  textBaseStyle,
  textFontWeightStyles,
  textSizeStyles,
} from "./Text.styles";

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
  | "formInput"
  | "emojiSymbol";

export const textPresets: Record<IPresets, ThemedStyleArray<TextStyle>> = {
  title: [textBaseStyle, textSizeStyles.xl, textFontWeightStyles.bold],

  body: [textBaseStyle],

  bodyBold: [textBaseStyle, textFontWeightStyles.medium],

  small: [textBaseStyle, textSizeStyles.xs],

  smaller: [textBaseStyle, textSizeStyles.xxs],

  smallerBold: [textBaseStyle, textSizeStyles.xxs, textFontWeightStyles.bold],

  bigBold: [textBaseStyle, textFontWeightStyles.semiBold],

  formHelper: [
    textBaseStyle,
    textSizeStyles.xxs,
    ({ colors }) => ({ color: colors.fill.secondary }),
  ],

  formLabel: [
    textBaseStyle,
    textSizeStyles.xxs,
    ({ colors }) => ({ color: colors.text.secondary }),
  ],

  formInput: [
    textBaseStyle,
    textSizeStyles.sm,
    textFontWeightStyles.normal,
    ({ colors }) => ({ color: colors.text.primary }),
  ],

  emojiSymbol: [textBaseStyle, { fontSize: 22, lineHeight: 28 }],
};
