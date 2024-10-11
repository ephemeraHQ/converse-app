import { memo, useCallback } from "react";
import {
  TouchableOpacity as RNTouchableOpacity,
  TouchableOpacityProps,
  GestureResponderEvent,
} from "react-native";

import { Haptics } from "../utils/haptics";

export type ITouchableOpacityProps = TouchableOpacityProps & {
  withHaptics?: boolean;
};

export const TouchableOpacity = memo(function TouchableOpacity(
  props: ITouchableOpacityProps
) {
  const { withHaptics, onPress: onPressProps, ...rest } = props;

  const onPress = useCallback(
    (e: GestureResponderEvent) => {
      if (onPressProps) {
        if (withHaptics) {
          Haptics.lightImpactAsync();
        }
        onPressProps(e);
      }
    },
    [onPressProps, withHaptics]
  );

  return <RNTouchableOpacity onPress={onPress} activeOpacity={0.8} {...rest} />;
});
