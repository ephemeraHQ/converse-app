import { TextStyle } from "react-native"
import { ThemedStyleArray } from "../../theme/use-app-theme"
import { textBaseStyle, textFontWeightStyles, textSizeStyles } from "./Text.styles"

export type IPresets =
  | "title"
  | "body"
  | "bodyBold"
  | "small"
  | "smaller"
  | "smallerBold"
  | "big"
  | "bigBold"
  | "formHelper"
  | "formLabel"
  | "emojiSymbol"

export const textPresets: Record<IPresets, ThemedStyleArray<TextStyle>> = {
  title: [textBaseStyle, textSizeStyles.xl, textFontWeightStyles.bold],

  body: [textBaseStyle],

  bodyBold: [textBaseStyle, textFontWeightStyles.medium],

  small: [textBaseStyle, textSizeStyles.xs],

  smaller: [textBaseStyle, textSizeStyles.xxs],

  smallerBold: [textBaseStyle, textSizeStyles.xxs, textFontWeightStyles.bold],

  big: [textBaseStyle, textSizeStyles.md],

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

  emojiSymbol: [textBaseStyle, { fontSize: 22, lineHeight: 28 }],
}
