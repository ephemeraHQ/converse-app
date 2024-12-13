import {
  KeyboardState,
  useAnimatedKeyboard,
  useAnimatedReaction,
  useSharedValue,
} from "react-native-reanimated";

export function useKeyboardIsShownRef() {
  const isKeyboardShown = useSharedValue(false);

  const { state } = useAnimatedKeyboard();

  useAnimatedReaction(
    () => state.value,
    (state) => {
      if (state === KeyboardState.OPEN) {
        console.log("keyboard is open");
        isKeyboardShown.value = true;
      } else if (state === KeyboardState.CLOSED) {
        console.log("keyboard is closed");
        isKeyboardShown.value = false;
      }
    }
  );

  return isKeyboardShown.value;
}
