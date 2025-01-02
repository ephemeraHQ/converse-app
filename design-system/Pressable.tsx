import { Haptics } from "@utils/haptics";
import { memo, useCallback } from "react";
import {
  GestureResponderEvent,
  Pressable as RNPressable,
  PressableProps as RNPressableProps,
} from "react-native";
import Animated from "react-native-reanimated";

export type IPressableProps = RNPressableProps & {
  withHaptics?: boolean;
};

export const Pressable = memo(function Pressable(props: IPressableProps) {
  const { withHaptics, onPress: onPressProps, ...rest } = props;

  const onPress = useCallback(
    (e: GestureResponderEvent) => {
      if (withHaptics) {
        Haptics.lightImpactAsync();
      }
      if (onPressProps) {
        onPressProps(e);
      }
    },
    [withHaptics, onPressProps]
  );

  return <RNPressable onPress={onPress} {...rest} />;
});

export const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
