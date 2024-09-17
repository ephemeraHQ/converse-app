import { Margins } from "@styles/sizes";
import React, { useState, useCallback, useRef } from "react";
import { ViewStyle, StyleProp, LayoutChangeEvent } from "react-native";
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";

import Banner from "./Banner";

interface AnimatedBannerProps {
  title: string;
  description: string;
  cta?: string;
  onButtonPress?: () => void;
  onDismiss?: () => void;
  style?: StyleProp<ViewStyle>;
}

const VERTICAL_MARGIN = Margins.default;

const AnimatedBanner: React.FC<AnimatedBannerProps> = React.memo((props) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const opacity = useSharedValue(1);
  const height = useSharedValue(0);
  const measuredHeight = useRef<number | null>(null);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (isAnimating) return;

      const layoutHeight = event.nativeEvent.layout.height;

      if (layoutHeight > 0 && measuredHeight.current === null) {
        measuredHeight.current = layoutHeight;
        height.value = layoutHeight + VERTICAL_MARGIN * 2;
      }
    },
    [height, isAnimating]
  );

  const handleDismiss = () => {
    setIsAnimating(true);
    const config = {
      duration: 200,
      easing: Easing.bezier(0.7, 0.0, 1, 1),
    };

    opacity.value = withTiming(0, config);
    height.value = withTiming(0, config, (finished) => {
      if (finished) {
        runOnJS(setIsVisible)(false);
        props.onDismiss && runOnJS(props.onDismiss)();
        measuredHeight.current = null;
        runOnJS(setIsAnimating)(false);
      }
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    height: isAnimating
      ? height.value
      : measuredHeight.current !== null
      ? height.value
      : "auto",
    overflow: "hidden",
  }));

  if (!isVisible) {
    return null; // Prevent re-rendering if not visible
  }

  return (
    <Reanimated.View style={[animatedStyle, { zIndex: 1000 }, props.style]}>
      <Banner {...props} onDismiss={handleDismiss} onLayout={handleLayout} />
    </Reanimated.View>
  );
});

export default AnimatedBanner;
