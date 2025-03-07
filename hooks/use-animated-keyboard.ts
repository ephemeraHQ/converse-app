import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller"
import { useDerivedValue, useSharedValue } from "react-native-reanimated"

export function useAnimatedKeyboard() {
  const { height, progress: progressAV } = useReanimatedKeyboardAnimation()

  const previousOpenKeyboardHeightAV = useSharedValue(0)

  // Because when it's open it's like -346
  const keyboardHeightAV = useDerivedValue(() => {
    const currentHeight = height.value * -1

    // Store previous height when keyboard is fully open
    if (progressAV.value === 1) {
      previousOpenKeyboardHeightAV.value = currentHeight
    }

    return currentHeight
  })

  return {
    keyboardHeightAV,
    progressAV,
    previousOpenKeyboardHeightAV,
  }
}
