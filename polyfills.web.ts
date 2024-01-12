import { Buffer } from "buffer";
import "setimmediate";
import { Alert, AlertButton, AlertOptions } from "react-native";

window.Buffer = window.Buffer || Buffer;

Alert.alert = (
  title: string,
  message?: string | undefined,
  buttons?: AlertButton[] | undefined,
  options?: AlertOptions | undefined
) => {
  const confirmOption = buttons?.find(({ style }) => style !== "cancel");
  const cancelOption = buttons?.find(({ style }) => style === "cancel");

  if (confirmOption && cancelOption) {
    const result = window.confirm([title, message].filter(Boolean).join("\n"));
    if (result) {
      confirmOption?.onPress?.();
    } else {
      cancelOption?.onPress?.();
    }
  } else {
    window.alert([title, message].filter(Boolean).join("\n"));
    (confirmOption || cancelOption)?.onPress?.();
  }
};
