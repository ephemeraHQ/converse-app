import { Keyboard } from "react-native"

export const executeAfterKeyboardClosed = (methodToExecute: () => void) => {
  const isKeyboardVisible = Keyboard.isVisible()
  if (isKeyboardVisible) {
    const subscription = Keyboard.addListener("keyboardDidHide", () => {
      methodToExecute()
      subscription.remove()
    })
    Keyboard.dismiss()
  } else {
    methodToExecute()
  }
}

export const dismissKeyboard = () => {
  Keyboard.dismiss()
}
