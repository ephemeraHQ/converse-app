import { memo, useCallback } from "react"
import {
  GestureResponderEvent,
  TouchableOpacity as RNTouchableOpacity,
  TouchableOpacityProps,
} from "react-native"
import Animated from "react-native-reanimated"
import { useAppTheme } from "@/theme/use-app-theme"
import { Haptics } from "../utils/haptics"

export type ITouchableOpacityProps = TouchableOpacityProps & {
  withHaptics?: boolean
}

export const TOUCHABLE_OPACITY_ACTIVE_OPACITY = 0.7

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(RNTouchableOpacity)

export const TouchableOpacity = memo(function TouchableOpacity(props: ITouchableOpacityProps) {
  const { withHaptics, onPress: onPressProps, ...rest } = props

  const { theme } = useAppTheme()

  const onPress = useCallback(
    (e: GestureResponderEvent) => {
      if (onPressProps) {
        if (withHaptics) {
          Haptics.lightImpactAsync()
        }
        onPressProps(e)
      }
    },
    [onPressProps, withHaptics],
  )

  return (
    <AnimatedTouchableOpacity
      layout={theme.animation.reanimatedLayoutSpringTransition}
      onPress={onPress}
      activeOpacity={TOUCHABLE_OPACITY_ACTIVE_OPACITY}
      {...rest}
    />
  )
})
