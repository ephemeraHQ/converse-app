import { IColors } from "@theme/colorsLight"
import { typography } from "@theme/typography"
import { TextProps as RNTextProps, StyleProp, TextStyle } from "react-native"
import { i18n, TxKeyPath } from "../../i18n"
import { IPresets } from "./Text.presets"
import { textSizeStyles } from "./Text.styles"

export type ISizes = keyof typeof textSizeStyles
export type IWeights = keyof typeof typography.primary
export type ITextColors = Exclude<keyof IColors["text"], "inverted">
export type IInvertedTextColors = keyof IColors["text"]["inverted"]

export type ITextStyleProps = {
  /**
   * An optional style override useful for padding & margin.
   */
  style?: StyleProp<TextStyle>
  /**
   * One of the different types of text presets.
   */
  preset?: IPresets
  /**
   * Text weight modifier.
   */
  weight?: IWeights
  /**
   * Text size modifier.
   */
  size?: ISizes
  /**
   * Text color modifier.
   */
  color?: ITextColors | IInvertedTextColors
  /**
   * Inverted text color.
   */
  inverted?: boolean
}

export type ITextProps = RNTextProps &
  ITextStyleProps & {
    /**
     * Text which is looked up via i18n.
     */
    tx?: TxKeyPath
    /**
     * The text to display if not using `tx` or nested components.
     */
    text?: string
    /**
     * Optional options to pass to i18n. Useful for interpolation
     * as well as explicitly setting locale or translation fallbacks.
     */
    txOptions?: i18n.TranslateOptions
    /**
     * Children components.
     */
    children?: React.ReactNode
  }
