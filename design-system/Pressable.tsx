import { Haptics } from "@utils/haptics";
import { memo, useCallback } from "react";
import {
  GestureResponderEvent,
  Pressable as RNPressable,
  PressableProps as RNPressableProps,
} from "react-native";

type IPressableProps = RNPressableProps & {
  withHaptic?: boolean;
};

export const Pressable = memo(function Pressable(props: IPressableProps) {
  const { onPress, withHaptic, ...rest } = props;

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      if (withHaptic) {
        Haptics.softImpactAsync();
      }
      if (onPress) {
        onPress(event);
      }
    },
    [onPress, withHaptic]
  );

  return <RNPressable {...rest} onPress={handlePress} />;
});
