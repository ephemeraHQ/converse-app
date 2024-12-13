import {
  runOnJS,
  KeyboardState,
  useAnimatedReaction,
  useAnimatedKeyboard,
} from "react-native-reanimated";

type IKeyboardHandlersArgs = {
  onKeyboardOpen: () => void;
  onKeyboardClose: () => void;
};

export function useKeyboardHandlers(args: IKeyboardHandlersArgs) {
  const { state } = useAnimatedKeyboard();

  useAnimatedReaction(
    () => state.value,
    (state) => {
      if (state === KeyboardState.OPEN) {
        runOnJS(args.onKeyboardOpen)();
      } else if (state === KeyboardState.CLOSED) {
        runOnJS(args.onKeyboardClose)();
      }
    }
  );
}
