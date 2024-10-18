import React, { memo, useCallback, useMemo } from "react";
import { GestureResponderEvent, Platform } from "react-native";
import {
  IconButtonProps as IRNPIconButtonProps,
  IconButton as RNPIconButton,
} from "react-native-paper";
import { IconSource as RNPIconSource } from "react-native-paper/lib/typescript/components/Icon";
import { interpolate, useAnimatedStyle } from "react-native-reanimated";

import { TOUCHABLE_OPACITY_ACTIVE_OPACITY } from "./TouchableOpacity";
import { AnimatedVStack } from "./VStack";
import Picto from "../components/Picto/Picto";
import { usePressInOut } from "../hooks/usePressInOut";
import { $globalStyles } from "../theme/styles";
import { useAppTheme } from "../theme/useAppTheme";
import { Haptics } from "../utils/haptics";

type IIconButtonVariant = "solid" | "outlined" | "subtle";

type IIconButtonAction =
  | "primary"
  | "secondary"
  | "positive"
  | "negative"
  | "warning"
  | "text";

type IIconButtonProps = Omit<IRNPIconButtonProps, "icon"> & {
  withHaptics?: boolean;
  variant?: IIconButtonVariant;
  action?: IIconButtonAction;
} & (
    | {
        icon:
          | React.ReactNode
          | ((args: { size: number; color: string }) => React.ReactNode);
        iconName?: never;
      }
    | { iconName: string; icon?: never }
  );

export const IconButton = memo(function IconButton({
  style: styleOverride,
  icon,
  iconName,
  onPress: onPressProps,
  withHaptics = true,
  variant,
  action = "primary",
  ...rest
}: IIconButtonProps) {
  const { handlePressIn, handlePressOut, pressedInAV } = usePressInOut();
  const { theme } = useAppTheme();

  const renderIcon: RNPIconSource = useCallback(
    (props: { size: number; color: string }) => {
      if (React.isValidElement(icon)) {
        return icon;
      } else if (typeof icon === "function") {
        return icon(props);
      } else if (typeof icon === "string") {
        return <Picto picto={icon} color={props.color} size={props.size} />;
      }

      if (iconName) {
        return <Picto picto={iconName} color={props.color} size={props.size} />;
      }

      return null;
    },
    [icon, iconName]
  );

  const animatedStyle = useAnimatedStyle(() => {
    if (!pressedInAV) {
      return {
        opacity: 1,
      };
    }

    return {
      opacity: interpolate(
        pressedInAV.value,
        [0, 1],
        [1, TOUCHABLE_OPACITY_ACTIVE_OPACITY]
      ),
    };
  });

  const onPress = useCallback(
    (e: GestureResponderEvent) => {
      if (onPressProps) {
        if (withHaptics) {
          Haptics.lightImpactAsync();
        }
        onPressProps(e);
      }
    },
    [withHaptics, onPressProps]
  );

  const mode = useMemo(() => {
    switch (variant) {
      case "outlined":
        return "outlined";
      case "subtle":
        return "contained-tonal";
      case "solid":
        return "contained";
      default:
        // Will just render the icon, no background or border
        return undefined;
    }
  }, [variant]);

  const color = useMemo(() => {
    switch (action) {
      case "secondary":
        return theme.colors.text.secondary;
      case "positive":
        return theme.colors.text.primary;
      case "negative":
        return theme.colors.global.danger;
      case "warning":
        return theme.colors.global.danger;
      case "text":
        return theme.colors.text.primary;
      default:
        return theme.colors.text.primary;
    }
  }, [action, theme.colors]);

  return (
    <AnimatedVStack style={animatedStyle}>
      <RNPIconButton
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        icon={renderIcon}
        mode={mode}
        iconColor={color}
        style={[$globalStyles.center, $globalStyles.flex1, styleOverride]}
        {...Platform.select({
          ios: {
            underlayColor: "transparent",
            rippleColor: "transparent",
          },
        })}
        {...rest}
      />
    </AnimatedVStack>
  );
});
