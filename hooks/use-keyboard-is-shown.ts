import { useState } from "react"
import { runOnJS, useAnimatedReaction } from "react-native-reanimated"
import { useAnimatedKeyboard } from "@/hooks/use-animated-keyboard"

export function useKeyboardIsShown() {
  const [isKeyboardShown, setIsKeyboardShown] = useState(false)

  const { progressAV } = useAnimatedKeyboard()

  useAnimatedReaction(
    () => progressAV.value,
    (progress) => {
      if (progress === 1) {
        runOnJS(setIsKeyboardShown)(true)
      } else if (progress === 0) {
        runOnJS(setIsKeyboardShown)(false)
      }
    },
  )

  return isKeyboardShown
}
