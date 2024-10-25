import { useCallback } from "react";
import {
  useSharedValue,
  useAnimatedReaction,
  withTiming,
} from "react-native-reanimated";

import { timing } from "../theme";

export function usePressInOut() {
  const pressedInAV = useSharedValue(0);

  const hasTriggeredHapticAV = useSharedValue(false);

  useAnimatedReaction(
    () => pressedInAV.value === 0,
    (v) => {
      if (v) {
        hasTriggeredHapticAV.value = false;
      }
    }
  );

  const handlePressIn = useCallback(() => {
    pressedInAV.value = withTiming(1, { duration: timing.veryFast });
  }, [pressedInAV]);

  const handlePressOut = useCallback(() => {
    pressedInAV.value = withTiming(0, { duration: timing.veryFast });
  }, [pressedInAV]);

  return {
    pressedInAV,
    handlePressIn,
    handlePressOut,
  };
}
