import { AnimatedHStack } from "@/design-system/HStack";
import { useAppTheme } from "@/theme/useAppTheme";
import { debugBorder } from "@/utils/debug-style";
import { Haptics } from "@/utils/haptics";
import { memo } from "react";
import { View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureStateChangeEvent,
  LongPressGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import Animated, {
  Easing,
  measure,
  runOnJS,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// Super fast because it's better UX to have a quick response
// Also, we can't use onBegin to start the scaling as soon as the gesture starts because we also have a tap handler
// So for example if we had onBegin, and the user just tapped, it would still start the scaling animation which is weird
export const MESSAGE_GESTURE_LONG_PRESS_MIN_DURATION = 300;

export const MESSAGE_GESTURE_LONG_PRESS_SCALE = 1.025;

type IContainerMeasure = {
  width: number;
  height: number;
  pageX: number;
  pageY: number;
};

export type IMessageGesturesOnLongPressArgs =
  GestureStateChangeEvent<LongPressGestureHandlerEventPayload> &
    IContainerMeasure;

export type IMessageGesturesProps = {
  children: React.ReactNode;
  onTap?: () => void;
  //   onDoubleTap?: () => void;
  onLongPress?: (e: IMessageGesturesOnLongPressArgs) => void;
};

export const MessageGestures = memo(function MessageGestures(
  args: IMessageGesturesProps
) {
  const {
    children,
    onTap,
    //    onDoubleTap,
    onLongPress,
  } = args;

  const containerRef = useAnimatedRef<View>();

  const scaleAV = useSharedValue(1);

  const tap = Gesture.Tap()
    .onEnd(() => {
      console.log("tap");
      if (onTap) {
        onTap();
      }
    })
    .runOnJS(true);

  //   const doubleTap = Gesture.Tap()
  //     .numberOfTaps(2)
  //     .onEnd(() => {
  //       if (onDoubleTap) {
  //         onDoubleTap();
  //       }
  //     })
  //     .runOnJS(true);

  const longPress = Gesture.LongPress()
    .onStart((e) => {
      Haptics.softImpactAsyncAnimated();
      scaleAV.value = withTiming(MESSAGE_GESTURE_LONG_PRESS_SCALE, {
        duration: MESSAGE_GESTURE_LONG_PRESS_MIN_DURATION * 2,
        easing: Easing.bezier(0.31, 0.04, 0.03, 1.04),
      });
      const measured = measure(containerRef);
      if (!measured) return;
      if (onLongPress) {
        runOnJS(onLongPress)({ ...e, ...measured });
      }
    })
    .onFinalize(() => {
      scaleAV.value = withTiming(1, {
        duration: MESSAGE_GESTURE_LONG_PRESS_MIN_DURATION * 2,
        easing: Easing.bezier(0.82, 0.06, 0.42, 1.01),
      });
    })
    .minDuration(MESSAGE_GESTURE_LONG_PRESS_MIN_DURATION);

  const composed = Gesture.Simultaneous(
    //   doubleTap,
    tap,
    longPress
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleAV.value }],
    };
  });

  return (
    <GestureDetector gesture={composed}>
      <AnimatedHStack
        // {...debugBorder("orange")}
        ref={containerRef}
        style={animatedStyle}
      >
        {children}
      </AnimatedHStack>
    </GestureDetector>
  );
});
