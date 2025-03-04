import { memo } from "react"
import { View, ViewStyle } from "react-native"
import {
  Gesture,
  GestureDetector,
  GestureStateChangeEvent,
  LongPressGestureHandlerEventPayload,
} from "react-native-gesture-handler"
import {
  measure,
  runOnJS,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated"
import { AnimatedHStack } from "@/design-system/HStack"
import { useAppTheme } from "@/theme/use-app-theme"
import { Haptics } from "@/utils/haptics"

// Super fast because it's better UX to have a quick response
const MESSAGE_GESTURE_LONG_PRESS_MIN_DURATION = 150

const MESSAGE_GESTURE_LONG_PRESS_SCALE = 1.025

type IContainerMeasure = {
  width: number
  height: number
  pageX: number
  pageY: number
}

export type IMessageGesturesOnLongPressArgs =
  GestureStateChangeEvent<LongPressGestureHandlerEventPayload> & IContainerMeasure

export type IConversationMessageGesturesDumbProps = {
  children: React.ReactNode
  style?: ViewStyle
  onTap?: () => void
  onDoubleTap?: () => void
  onLongPress?: (e: IMessageGesturesOnLongPressArgs) => void
}

export const ConversationMessageGesturesDumb = memo(function ConversationMessageGesturesDumb(
  args: IConversationMessageGesturesDumbProps,
) {
  const { children, onTap, onDoubleTap, onLongPress, style } = args

  const { theme } = useAppTheme()

  const containerRef = useAnimatedRef<View>()

  const scaleAV = useSharedValue(1)

  const tap = Gesture.Tap()
    .onEnd(() => {
      if (onTap) {
        runOnJS(onTap)()
      }
    })
    .hitSlop(theme.spacing.xs)

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (onDoubleTap) {
        runOnJS(onDoubleTap)()
      }
    })
    .hitSlop(theme.spacing.xs)

  const longPress = Gesture.LongPress()
    // We can't use onBegin to start the scaling as soon as the gesture starts because we also have a tap handler
    // So for example if we had onBegin, and the user just tapped, it would still start the scaling animation which is weird
    .onStart((e) => {
      Haptics.softImpactAsyncAnimated()

      scaleAV.value = theme.animation.appleContextMenu.start

      const measured = measure(containerRef)
      if (!measured) return
      if (onLongPress) {
        runOnJS(onLongPress)({ ...e, ...measured })
      }
    })
    .onFinalize(() => {
      scaleAV.value = theme.animation.appleContextMenu.end
    })
    .minDuration(MESSAGE_GESTURE_LONG_PRESS_MIN_DURATION)
    .hitSlop(theme.spacing.xs)

  const tapGestures = Gesture.Exclusive(doubleTap, tap)
  const composed = Gesture.Race(tapGestures, longPress)

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleAV.value }],
    }
  })

  return (
    <GestureDetector gesture={composed}>
      <AnimatedHStack
        // {...debugBorder("orange")}
        ref={containerRef}
        style={[animatedStyle, style]}
      >
        {children}
      </AnimatedHStack>
    </GestureDetector>
  )
})
