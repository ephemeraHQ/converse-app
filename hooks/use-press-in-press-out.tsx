import { useCallback } from "react"
import { useAnimatedReaction, useSharedValue, withTiming } from "react-native-reanimated"
import { useAppTheme } from "@/theme/use-app-theme"

export function usePressInOut() {
  const { theme } = useAppTheme()

  const pressedInAV = useSharedValue(0)

  const hasTriggeredHapticAV = useSharedValue(false)

  useAnimatedReaction(
    () => pressedInAV.value === 0,
    (v) => {
      if (v) {
        hasTriggeredHapticAV.value = false
      }
    },
  )

  const handlePressIn = useCallback(() => {
    pressedInAV.value = withTiming(1, { duration: theme.timing.veryFast })
  }, [pressedInAV, theme])

  const handlePressOut = useCallback(() => {
    pressedInAV.value = withTiming(0, { duration: theme.timing.veryFast })
  }, [pressedInAV, theme])

  return {
    pressedInAV,
    handlePressIn,
    handlePressOut,
  }
}
