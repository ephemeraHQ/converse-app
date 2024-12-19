import { useState } from "react";
import {
  KeyboardState,
  runOnJS,
  useAnimatedKeyboard,
  useAnimatedReaction,
} from "react-native-reanimated";

export function useKeyboardIsShown() {
  const [isKeyboardShown, setIsKeyboardShown] = useState(false);

  const { state } = useAnimatedKeyboard();

  useAnimatedReaction(
    () => state.value,
    (state) => {
      if (state === KeyboardState.OPEN) {
        runOnJS(setIsKeyboardShown)(true);
      } else if (state === KeyboardState.CLOSED) {
        runOnJS(setIsKeyboardShown)(false);
      }
    }
  );

  return isKeyboardShown;
}
