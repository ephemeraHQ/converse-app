import { TextProps as RNTextProps, StyleProp, TextStyle } from "react-native";

import { IPresets } from "./Text.presets";
import { $sizeStyles } from "./Text.styles";
import { i18n, TxKeyPath } from "../../i18n";
import { typography } from "../../theme";

export type ISizes = keyof typeof $sizeStyles;
export type IWeights = keyof typeof typography.primary;
export interface ITextProps extends RNTextProps {
  /**
   * Text which is looked up via i18n.
   */
  tx?: TxKeyPath;
  /**
   * The text to display if not using `tx` or nested components.
   */
  text?: string;
  /**
   * Optional options to pass to i18n. Useful for interpolation
   * as well as explicitly setting locale or translation fallbacks.
   */
  txOptions?: i18n.TranslateOptions;
  /**
   * An optional style override useful for padding & margin.
   */
  style?: StyleProp<TextStyle>;
  /**
   * One of the different types of text presets.
   */
  preset?: IPresets;
  /**
   * Text weight modifier.
   */
  weight?: IWeights;
  /**
   * Text size modifier.
   */
  size?: ISizes;
  /**
   * Children components.
   */
  children?: React.ReactNode;
}
