import { Keyboard, Platform } from "react-native";

export const executeAfterKeyboardClosed = (methodToExecute: () => void) => {
  if (Platform.OS === "web") {
    methodToExecute();
    return;
  }
  const isKeyboardVisible = Keyboard.isVisible();
  if (isKeyboardVisible) {
    const subscription = Keyboard.addListener("keyboardDidHide", () => {
      methodToExecute();
      subscription.remove();
    });
    Keyboard.dismiss();
  } else {
    methodToExecute();
  }
};
