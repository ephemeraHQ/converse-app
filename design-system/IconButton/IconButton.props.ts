// IconButton.props.ts
import { IIconName } from "@design-system/Icon/Icon.types";
import {
  PressableProps as RNPressableProps,
  StyleProp,
  ViewStyle,
} from "react-native";

export type IIconButtonVariant = "outline" | "subtle" | "fill" | "ghost";
export type IIconButtonSize = "md" | "lg";
export type IIconButtonAction = "primary" | "danger";

export interface IIconButtonProps extends RNPressableProps {
  /**
   * The icon component to render.
   * If provided, it will be rendered inside the button.
   */
  icon?: React.ReactNode;

  /**
   * The name of the icon to render (if using an icon library).
   * This is useful if you're using a predefined set of icons.
   */
  iconName?: IIconName;

  /**
   * The variant of the button.
   * Determines the button's overall style.
   */
  variant?: IIconButtonVariant;

  /**
   * The size of the button.
   * Controls the button's dimensions.
   */
  size?: IIconButtonSize;

  /**
   * The action style of the button.
   * Used to indicate the button's purpose (e.g., primary, danger).
   */
  action?: IIconButtonAction;

  /**
   * An optional style override for the button container.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * An optional style override for the button when pressed.
   */
  pressedStyle?: StyleProp<ViewStyle>;

  /**
   * An optional style override for the disabled state.
   */
  disabledStyle?: StyleProp<ViewStyle>;

  /**
   * Whether the button is disabled.
   */
  disabled?: boolean;
}
