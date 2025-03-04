import { Alert, AlertButton, AlertOptions } from "react-native"

type IAlertButtonIndex = number

/**
 * Creates an Alert that returns a Promise which resolves when a button is clicked.
 * The Promise resolves with the index of the button that was pressed.
 */
export function createPromiseAlert(args: {
  title: string
  message?: string
  buttons?: AlertButton[]
  options?: AlertOptions
  cancelButtonIndex?: number
}) {
  const { title, message, buttons = [], options, cancelButtonIndex } = args

  return new Promise<IAlertButtonIndex>((resolve) => {
    // Map the original buttons to add the resolve callback to each onPress
    const buttonsWithPromiseResolution = buttons.map((button, index) => {
      const originalOnPress = button.onPress

      return {
        ...button,
        onPress: () => {
          // Call the original onPress if it exists
          if (originalOnPress) {
            originalOnPress()
          }

          // Resolve the promise with the button index
          resolve(index)
        },
      }
    })

    // If no buttons are provided, add a default "OK" button
    if (buttonsWithPromiseResolution.length === 0) {
      buttonsWithPromiseResolution.push({
        text: "OK",
        onPress: () => resolve(0),
      })
    }

    // Show the alert
    Alert.alert(title, message, buttonsWithPromiseResolution, options)
  })
}

/**
 * Creates a confirmation Alert that returns a Promise which resolves with a boolean
 * indicating whether the user confirmed (true) or canceled (false).
 */
export function createConfirmationAlert(args: {
  title: string
  message?: string
  confirmText?: string
  cancelText?: string
  options?: AlertOptions
}) {
  const { title, message, confirmText = "OK", cancelText = "Cancel", options } = args

  return new Promise<boolean>((resolve) => {
    Alert.alert(
      title,
      message,
      [
        {
          text: cancelText,
          style: "cancel",
          onPress: () => resolve(false),
        },
        {
          text: confirmText,
          style: "default",
          onPress: () => resolve(true),
        },
      ],
      options,
    )
  })
}
