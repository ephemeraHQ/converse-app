import { runOnJS, useAnimatedReaction } from "react-native-reanimated"
import { useAnimatedKeyboard } from "@/hooks/use-animated-keyboard"

type IKeyboardHandlersArgs = {
  onKeyboardOpen: () => void
  onKeyboardClose: () => void
}

export function useKeyboardHandlers(args: IKeyboardHandlersArgs) {
  const { progress } = useAnimatedKeyboard()

  useAnimatedReaction(
    () => progress.value,
    (progress) => {
      if (progress === 1) {
        runOnJS(args.onKeyboardOpen)()
      } else if (progress === 0) {
        runOnJS(args.onKeyboardClose)()
      }
    },
  )
}
