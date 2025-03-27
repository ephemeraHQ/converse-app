import { StyleProp, StyleSheet } from "react-native"

export function flattenStyles<T>(styles: StyleProp<T>) {
  return StyleSheet.flatten(styles)
}
