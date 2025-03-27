// IconButton.props.ts
import { IIconName, IIconProps } from "@design-system/Icon/Icon.types"
import { PressableProps as RNPressableProps, StyleProp, ViewStyle } from "react-native"

export type IIconButtonVariant = "outline" | "subtle" | "fill" | "ghost"
export type IIconButtonSize = "sm" | "md" | "lg" | "xl"
export type IIconButtonAction = "primary" | "danger"

export type IIconButtonProps = {
  /**
   * The icon component to render.
   * If provided, it will be rendered inside the button.
   */
  icon?: React.ReactNode

  /**
   * The name of the icon to render (if using an icon library).
   * This is useful if you're using a predefined set of icons.
   */
  iconName?: IIconName

  /**
   * The weight of the icon.
   */
  iconWeight?: IIconProps["weight"]

  /**
   * The size of the icon.
   */
  iconSize?: IIconProps["size"]

  /**
   * The variant of the button.
   * Determines the button's overall style.
   */
  variant?: IIconButtonVariant

  /**
   * The size of the button.
   * Controls the button's dimensions.
   */
  size?: IIconButtonSize

  /**
   * The action style of the button.
   * Used to indicate the button's purpose (e.g., primary, danger).
   */
  action?: IIconButtonAction

  /**
   * An optional style override for the button container.
   */
  style?: StyleProp<ViewStyle>

  /**
   * An optional style override for the button when pressed.
   */
  pressedStyle?: StyleProp<ViewStyle>

  /**
   * An optional style override for the disabled state.
   */
  disabledStyle?: StyleProp<ViewStyle>

  /**
   * Whether the button is disabled.
   */
  disabled?: boolean

  /**
   * Haptic or not
   */
  withHaptics?: boolean

  /**
   * Prevent double tap
   */
  preventDoubleTap?: boolean
} & RNPressableProps
