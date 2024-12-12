import { memo } from "react";
import { AnimatedVStack } from "@design-system/VStack";
import { useAnimatedKeyboard, useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const KeyboardFiller = memo(function KeyboardFiller() {
  const { height: keyboardHeightAV } = useAnimatedKeyboard();
  const insets = useSafeAreaInsets();

  const as = useAnimatedStyle(() => ({
    height: Math.max(keyboardHeightAV.value - insets.bottom, 0),
  }));

  return <AnimatedVStack style={as} />;
});
