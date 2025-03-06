import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller"

export function useAnimatedKeyboard() {
  const { height, progress } = useReanimatedKeyboardAnimation()
  return { height, progress }
}
