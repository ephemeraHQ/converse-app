import { AnimatedPressable, IPressableProps } from "@design-system/Pressable"
import { memo, useCallback } from "react"
import { GestureResponderEvent } from "react-native"
import {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import { Haptics } from "../utils/haptics"

export type IPressableScaleProps = IPressableProps

export const PressableScale = memo(function PressableScale(props: IPressableScaleProps) {
  const { withHaptics, onPress: onPressProps, style, ...rest } = props

  const { handlePressIn, handlePressOut, animatedStyle } = usePressInDepth({
    withHapticFeedback: withHaptics,
  })

  const onPress = useCallback(
    (e: GestureResponderEvent) => {
      if (withHaptics) {
        Haptics.lightImpactAsync()
      }
      if (onPressProps) {
        onPressProps(e)
      }
    },
    [onPressProps, withHaptics],
  )

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={[style, animatedStyle]}
      {...rest}
    >
      {props.children}
    </AnimatedPressable>
  )
})

function usePressInDepth(options?: { withHapticFeedback?: boolean }) {
  const { withHapticFeedback = true } = options || {}

  const pressedInAV = useSharedValue(0)

  const hasTriggeredHapticAV = useSharedValue(false)

  // Only if we press long enough
  // otherwise we don't want to trigger the haptic
  // too many haptics at the same time...
  useAnimatedReaction(
    () => pressedInAV.value > 0.7 && !hasTriggeredHapticAV.value,
    (v) => {
      if (withHapticFeedback && v) {
        // NOT SURE... On Android it's too much
        // hasTriggeredHapticAV.value = true
        // Haptics.softImpactAsyncAnimated()
      }
    },
    [withHapticFeedback],
  )

  useAnimatedReaction(
    () => pressedInAV.value === 0,
    (v) => {
      if (v) {
        hasTriggeredHapticAV.value = false
      }
    },
  )

  const handlePressIn = useCallback(() => {
    pressedInAV.value = withTiming(1)
  }, [pressedInAV])

  const handlePressOut = useCallback(() => {
    pressedInAV.value = withTiming(0)
  }, [pressedInAV])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: 1 - pressedInAV.value * 0.05,
        },
      ],
    }
  }, [])

  return {
    pressedInAV,
    handlePressIn,
    handlePressOut,
    animatedStyle,
  }
}
