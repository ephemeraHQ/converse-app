// IconButton.styles.ts
import { TextStyle, ViewStyle } from "react-native";

import {
  IIconButtonAction,
  IIconButtonSize,
  IIconButtonVariant,
} from "./IconButton.props";
import { Theme } from "../../theme/useAppTheme";

interface IconButtonStyleProps {
  variant: IIconButtonVariant;
  size: IIconButtonSize;
  action: IIconButtonAction;
  pressed?: boolean;
  disabled?: boolean;
}

export const getIconButtonViewStyle =
  ({
    variant,
    size,
    action,
    pressed = false,
    disabled = false,
  }: IconButtonStyleProps) =>
  (theme: Theme): ViewStyle => {
    const { spacing, colors, borderRadius } = theme;

    const style: ViewStyle = {
      justifyContent: "center",
      alignItems: "center",
      borderRadius: borderRadius.sm,
      overflow: "hidden",
    };

    // Set size
    const sizeStyles = {
      md: {
        width: spacing.xl,
        height: spacing.xl,
      },
      lg: {
        width: spacing.xxl,
        height: spacing.xxl,
      },
    };
    Object.assign(style, sizeStyles[size]);

    if (action === "primary") {
      switch (variant) {
        case "fill":
          style.backgroundColor = colors.fill.primary;
          if (pressed) {
            style.backgroundColor = colors.fill.secondary;
          }
          if (disabled) {
            style.backgroundColor = colors.fill.tertiary;
          }
          break;

        case "outline":
          style.borderWidth = 1;
          style.borderColor = colors.border.secondary;
          style.backgroundColor = "transparent";
          if (pressed) {
            style.backgroundColor = colors.fill.minimal;
          }
          if (disabled) {
            style.borderColor = colors.border.secondary;
            style.backgroundColor = "transparent";
          }
          break;

        case "ghost":
          style.backgroundColor = "transparent";
          // TODO: put back when we're done refactoring all the iconButton and buttons
          //   if (pressed) {
          //     style.backgroundColor = colors.fill.minimal;
          //   }
          // Temporary opacity change for the variant="text" button
          if (pressed) {
            style.opacity = 0.8;
          }
          break;

        default:
          break;
      }
    }

    return style;
  };

export const getIconStyle =
  ({
    variant,
    size,
    action,
    pressed = false,
    disabled = false,
  }: IconButtonStyleProps) =>
  (theme: Theme): TextStyle => {
    const { colors, spacing } = theme;

    const style: TextStyle = {};

    // Set icon size
    const sizeStyles = {
      md: {
        fontSize: spacing.lg, // Adjust as needed
      },
      lg: {
        fontSize: spacing.xl, // Adjust as needed
      },
    };

    Object.assign(style, sizeStyles[size]);

    if (action === "primary") {
      switch (variant) {
        case "fill":
          style.color = colors.text.inverted.primary;
          break;

        case "outline":
          style.color = colors.text.primary;
          if (disabled) {
            style.color = colors.fill.tertiary;
          }
          break;

        case "ghost":
          style.color = colors.text.primary;
          if (disabled) {
            style.color = colors.fill.tertiary;
          }
          break;

        default:
          break;
      }
    }

    return style;
  };

export const getIconProps =
  ({
    variant,
    size,
    action,
    pressed = false,
    disabled = false,
  }: IconButtonStyleProps) =>
  (theme: Theme) =>
    // TODO: fix once we fixed IconProps
    // : Partial<IIconProps>
    {
      const { colors, spacing } = theme;

      const props: any =
        // :Partial<IIconProps>
        {};

      // Set icon size
      const sizeMap = {
        md: spacing.md,
        lg: spacing.lg,
      };

      props.size = sizeMap[size];

      if (disabled) {
        props.color = colors.text.tertiary;
        return props;
      }

      if (action === "primary") {
        switch (variant) {
          case "fill":
            props.color = colors.text.inverted.primary;
            break;

          case "outline":
          case "ghost":
            props.color = colors.text.primary;
            break;

          default:
            break;
        }
      }

      return props;
    };
