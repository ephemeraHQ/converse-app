import React, { useCallback, useMemo } from "react";
import {
  GestureResponderEvent,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";
import { Button as RNPButton } from "react-native-paper";

import Picto from "../../components/Picto/Picto";
import { useAppTheme } from "../../theme/useAppTheme";

export type IButtonAction =
  | "primary"
  | "secondary"
  | "positive"
  | "negative"
  | "danger"
  /**
   * @deprecated These action types are deprecated and will be removed in a future version.
   */
  | "warning"
  | "text";

export type IButtonVariant = "solid" | "link" | "outlined";

export type IButtonProps = {
  title: string;
  action?: IButtonAction;
  variant?: IButtonVariant;
  onPress?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  picto?: string;
  hitSlop?: number;
};

export function Button({
  title,
  onPress,
  variant = "solid",
  action = "primary",
  textStyle,
  picto,
  hitSlop,
  style,
  ...rest
}: IButtonProps) {
  const { theme } = useAppTheme();

  const renderIcon = useCallback(
    ({ color, size }: { color: string; size: number }) => {
      if (!picto) {
        return null;
      }
      return <Picto picto={picto} color={color} size={size} />;
    },
    [picto]
  );

  const mode = useMemo(() => {
    switch (variant) {
      case "solid":
        return "contained";
      case "outlined":
        return "outlined";
      case "link":
      default:
        return "text";
    }
  }, [variant]);

  const labelColor = useMemo(() => {
    return action === "text"
      ? theme.colors.text.primary
      : theme.colors.text.inverted.primary;
  }, [action, theme.colors]);

  const backgroundColor = useMemo(() => {
    if (variant === "solid") {
      switch (action) {
        case "primary":
          return theme.colors.fill.primary;
        case "secondary":
          return theme.colors.actionSecondary;
        case "danger":
          return theme.colors.global.danger;
        default:
          return undefined;
      }
    }
    return undefined;
  }, [variant, action, theme.colors]);

  const borderColor = useMemo(() => {
    if (variant === "outlined") {
      switch (action) {
        case "primary":
          return theme.colors.fill.primary;
        case "secondary":
          return theme.colors.actionSecondary;
        case "danger":
          return theme.colors.global.danger;
        default:
          return undefined;
      }
    }
    return undefined;
  }, [variant, action, theme.colors]);

  const textColor = useMemo(() => {
    return action === "text"
      ? theme.colors.global.primary
      : theme.colors.text.inverted.primary;
  }, [action, theme.colors]);

  return (
    <RNPButton
      mode={mode}
      onPress={onPress}
      labelStyle={[{ color: labelColor }, textStyle]}
      icon={renderIcon}
      hitSlop={hitSlop}
      style={[
        {
          borderRadius: theme.borderRadius.sm,
          backgroundColor,
          borderColor,
        },
        style,
      ]}
      textColor={textColor}
      buttonColor={backgroundColor}
      {...rest}
    >
      {title}
    </RNPButton>
  );
}
