import Clipboard from "@react-native-clipboard/clipboard"

export function copyToClipboard(text: string) {
  Clipboard.setString(text)
}
