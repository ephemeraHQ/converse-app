import { MenuAction as RNMenuAction } from "@react-native-menu/menu"
import { Platform } from "react-native"

/**
 * Android will always make a sub menu item, so instead this will just return the item
 * iOS seems to work fine with the item, so this will just return the item
 * @param item RN Menu Action
 * @returns RN Menu Action
 */
export const getInlinedItem = (item: RNMenuAction): RNMenuAction => {
  if (Platform.OS === "ios") {
    return {
      title: "",
      displayInline: true,
      subactions: [item],
    }
  }
  return item
}
