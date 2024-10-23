// IconButton.tsx
import React, { useCallback } from "react";
import { PressableStateCallbackType, StyleProp, ViewStyle } from "react-native";

import { useAppTheme } from "../../theme/useAppTheme";
import { Icon } from "../Icon/Icon";
import { Pressable } from "../Pressable";
import { IIconButtonProps } from "./IconButton.props";
import {
  getIconButtonViewStyle,
  getIconProps,
  getIconStyle,
} from "./IconButton.styles";

export function IconButton(props: IIconButtonProps) {
  const {
    icon,
    iconName,
    variant = "fill",
    size = "md",
    action = "primary",
    style: styleOverride,
    pressedStyle: pressedStyleOverride,
    disabledStyle: disabledStyleOverride,
    disabled,
    ...rest
  } = props;

  const { themed } = useAppTheme();

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
    ({ pressed }: PressableStateCallbackType): StyleProp<ViewStyle> =>
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

  return (
    <Pressable
      style={viewStyle}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      {...rest}
    >
      {({ pressed }) => {
        if (iconName) {
          return (
            <Icon
              picto={iconName}
              style={iconStyle({ pressed })}
              {...iconProps({ pressed })}
            />
          );
        }

        return icon;
      }}
    </Pressable>
  );
}
