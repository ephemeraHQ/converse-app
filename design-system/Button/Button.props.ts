import { ComponentType } from "react";
import {
  PressableStateCallbackType,
  PressableProps as RNPressableProps,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";

import { IPicto } from "../../components/Picto/Picto";
import { ITextProps } from "../Text";

export type IButtonVariant =
  | "outline"
  | "fill"
  | "link"
  /** @deprecated */
  | "secondary"
  | "secondary-danger"
  | "text";

export type IButtonSize = "md" | "lg";

export type IButtonAction = "primary" | "danger";

export interface IButtonAccessoryProps {
  style: StyleProp<any>;
  pressableState: PressableStateCallbackType;
  disabled?: boolean;
}

export interface IButtonProps extends RNPressableProps {
  /**
   * Text which is looked up via i18n.
   */
  tx?: ITextProps["tx"];
  /**
   * The text to display if not using `tx` or nested components.
   */
  text?: ITextProps["text"];
  /**
   * Optional options to pass to i18n. Useful for interpolation
   * as well as explicitly setting locale or translation fallbacks.
   */
  txOptions?: ITextProps["txOptions"];
  /**
   * An optional style override useful for padding & margin.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * An optional style override for the "pressed" state.
   */
  pressedStyle?: StyleProp<ViewStyle>;
  /**
   * An optional style override for the button text.
   */
  textStyle?: StyleProp<TextStyle>;
  /**
   * An optional style override for the button text when in the "pressed" state.
   */
  pressedTextStyle?: StyleProp<TextStyle>;
  /**
   * An optional style override for the button text when in the "disabled" state.
   */
  disabledTextStyle?: StyleProp<TextStyle>;
  /**
   * One of the different types of button variants.
   */
  variant?: IButtonVariant;
  /**
   * The action style of the button.
   */
  action?: IButtonAction;
  /**
   * An optional component to render on the right side of the text.
   * Example: `RightAccessory={(props) => <View {...props} />}`
   */
  RightAccessory?: ComponentType<IButtonAccessoryProps>;
  /**
   * An optional component to render on the left side of the text.
   * Example: `LeftAccessory={(props) => <View {...props} />}`
   */
  LeftAccessory?: ComponentType<IButtonAccessoryProps>;
  /**
   * Children components.
   */
  children?: React.ReactNode;
  /**
   * disabled prop, accessed directly for declarative styling reasons.
   * https://reactnative.dev/docs/pressable#disabled
   */
  disabled?: boolean;
  /**
   * An optional style override for the disabled state
   */
  disabledStyle?: StyleProp<ViewStyle>;
  /**
   * An optional size for the button.
   */
  size?: IButtonSize;
  /**
   * Whether the button is loading.
   */
  loading?: boolean;
  /**
   * Whether the button should trigger a haptic feedback.
   */
  withHapticFeedback?: boolean;

  /** @deprecated */
  title?: string;
  /** @deprecated */
  picto?: IPicto;
}
