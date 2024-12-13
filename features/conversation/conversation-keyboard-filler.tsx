import { useKeyboardIsShown } from "@/hooks/use-keyboard-is-shown";
import { AnimatedVStack } from "@design-system/VStack";
import { memo, useEffect, useRef } from "react";
import { Keyboard, TextInput } from "react-native";
import {
  useAnimatedKeyboard,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IKeyboardFillerProps = {
  messageContextMenuIsOpen: boolean;
};

export const KeyboardFiller = memo(function KeyboardFiller(
  props: IKeyboardFillerProps
) {
  const { messageContextMenuIsOpen } = props;
  const { height: keyboardHeight } = useAnimatedKeyboard();
  const insets = useSafeAreaInsets();
  const lastKeyboardHeight = useSharedValue(0);
  const textInputRef = useRef<TextInput>(null);
  const keyboardWasOpenRef = useRef(false);
  const isKeyboardShown = useKeyboardIsShown();

  useEffect(() => {
    console.log("messageContextMenuIsOpen:", messageContextMenuIsOpen);
    console.log("keyboardWasOpenRef.current:", keyboardWasOpenRef.current);
    // Context menu was hidden
    if (!messageContextMenuIsOpen) {
      // Reopen keyboard if it was open before context menu was shown
      if (keyboardWasOpenRef.current) {
        textInputRef.current?.focus();
      }
    }
    // Context menu is shown
    else {
      if (isKeyboardShown) {
        Keyboard.dismiss();
        lastKeyboardHeight.value = keyboardHeight.value;
        keyboardWasOpenRef.current = true;
      } else {
        keyboardWasOpenRef.current = false;
      }
    }
  }, [
    messageContextMenuIsOpen,
    isKeyboardShown,
    keyboardHeight,
    lastKeyboardHeight,
  ]);

  // Reset the last height when context menu is dismissed
  // And make sure to wait until the keyboard is open to that the height animates back to what it was before
  useEffect(() => {
    if (!messageContextMenuIsOpen && isKeyboardShown) {
      lastKeyboardHeight.value = 0;
    }
  }, [
    messageContextMenuIsOpen,
    isKeyboardShown,
    keyboardHeight,
    lastKeyboardHeight,
  ]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: Math.max(
        Math.max(lastKeyboardHeight.value, keyboardHeight.value) -
          insets.bottom,
        0
      ),
    };
  });

  return (
    <>
      <AnimatedVStack style={animatedStyle} />
      <TextInput
        ref={textInputRef}
        style={{ height: 0, width: 0, opacity: 0, position: "absolute" }}
      />
    </>
  );
});
