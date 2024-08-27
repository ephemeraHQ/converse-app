import { Alert, AlertButton } from "react-native";

export const awaitableAlert = (
  title: string,
  message?: string,
  okButton?: string,
  cancelButton?: string
): Promise<boolean> =>
  new Promise((resolve) => {
    const buttons: AlertButton[] = [
      {
        text: okButton || "Ok",
        onPress: () => {
          resolve(true);
        },
        isPreferred: true,
      },
    ];
    if (cancelButton) {
      buttons.unshift({
        text: cancelButton,
        onPress: () => {
          resolve(false);
        },
      });
    }
    Alert.alert(title, message, buttons, { cancelable: false });
  });
