import React, { memo, useCallback } from "react";
import { GestureResponderEvent, Platform } from "react-native";
import {
  IconButtonProps as IRNPIconButtonProps,
  IconButton as RNPIconButton,
} from "react-native-paper";
import { IconSource as RNPIconSource } from "react-native-paper/lib/typescript/components/Icon";
import { interpolate, useAnimatedStyle } from "react-native-reanimated";

import { AnimatedCenter } from "./Center";
import { TOUCHABLE_OPACITY_ACTIVE_OPACITY } from "./TouchableOpacity";
import Picto from "../components/Picto/Picto";
import { usePressInOut } from "../hooks/usePressInOut";
import { $globalStyles } from "../theme/styles";
import { Haptics } from "../utils/haptics";

type IIconButtonProps = Omit<IRNPIconButtonProps, "icon"> & {
  withHaptics?: boolean;
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
  style: styleOveride,
  icon,
  iconName,
  onPress: onPressProps,
  withHaptics = true,
  ...rest
}: IIconButtonProps) {
  const { handlePressIn, handlePressOut, pressedInAV } = usePressInOut();

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
        console.log("props.color:", props.color);
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
        // Only haptics if we actually have an onPress handler
        if (withHaptics) {
          Haptics.lightImpactAsync();
        }
        onPressProps(e);
      }
    },
    [withHaptics, onPressProps]
  );

  return (
    <AnimatedCenter style={animatedStyle}>
      <RNPIconButton
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        icon={renderIcon}
        style={[$globalStyles.center, $globalStyles.flex1, styleOveride]}
        {...Platform.select({
          ios: {
            underlayColor: "transparent",
            rippleColor: "transparent",
          },
        })}
        {...rest}
      />
    </AnimatedCenter>
  );
});
