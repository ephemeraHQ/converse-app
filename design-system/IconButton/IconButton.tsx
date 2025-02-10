import { Haptics } from "@utils/haptics";
import React, { useCallback } from "react";
import {
  GestureResponderEvent,
  PressableStateCallbackType,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";
import { useAppTheme } from "../../theme/useAppTheme";
import { Icon } from "../Icon/Icon";
import { Pressable } from "../Pressable";
import { IIconButtonProps } from "./IconButton.props";
import {
  getIconButtonViewStyle,
  getIconProps,
  getIconStyle,
} from "./IconButton.styles";

export const IconButton = React.forwardRef(function IconButton(
  props: IIconButtonProps,
  ref
) {
  const {
    icon,
    iconName,
    iconWeight,
    variant = "fill",
    size = "md",
    action = "primary",
    style: styleOverride,
    pressedStyle: pressedStyleOverride,
    disabledStyle: disabledStyleOverride,
    disabled,
    withHaptics = true,
    onPress,
    ...rest
  } = props;

  const { theme, themed } = useAppTheme();

  const viewStyle = useCallback(
    ({ pressed }: PressableStateCallbackType): StyleProp<ViewStyle> => [
      themed(
        getIconButtonViewStyle({
          variant,
          size,
          action,
          pressed,
          disabled,
        })
      ),
      styleOverride,
      pressed && pressedStyleOverride,
      disabled && disabledStyleOverride,
    ],
    [
      themed,
      variant,
      size,
      action,
      disabled,
      styleOverride,
      pressedStyleOverride,
      disabledStyleOverride,
    ]
  );

  const iconStyle = useCallback(
    ({ pressed }: PressableStateCallbackType): StyleProp<TextStyle> =>
      themed(
        getIconStyle({
          variant,
          size,
          action,
          pressed,
          disabled,
        })
      ),
    [themed, variant, size, action, disabled]
  );

  // For now until we fix Icon

  const iconProps = useCallback(
    ({ pressed }: PressableStateCallbackType) =>
      themed(
        getIconProps({
          variant,
          size,
          action,
          pressed,
          disabled,
        })
      ),
    [themed, variant, size, action, disabled]
  );

  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      if (disabled) {
        return;
      }

      if (withHaptics) {
        Haptics.softImpactAsync();
      }
      onPress?.(e);
    },
    [withHaptics, onPress, disabled]
  );

  return (
    <Pressable
      style={viewStyle}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={handlePress}
      hitSlop={theme.spacing.xxs} // By default let's assume we want a small hitSlop
      {...rest}
    >
      {({ pressed, hovered }) => {
        if (iconName) {
          return (
            <Icon
              ref={ref}
              picto={iconName}
              style={iconStyle({ pressed, hovered })}
              weight={iconWeight}
              {...iconProps({ pressed, hovered })}
            />
          );
        }

        return icon;
      }}
    </Pressable>
  );
});
