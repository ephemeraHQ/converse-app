import { StyleProp, ViewStyle } from "react-native"

/**
 * Took only the props that we were using with "react-native-ios-context-menu".
 * If you want more props, you can add them here and make sure to handle them for Android context-menu
 */

export type IContextMenuViewProps = {
  menuConfig: {
    menuTitle: string
    menuItems: IMenuActionConfig[]
  }
  previewConfig?: {
    previewType: "CUSTOM"
    previewSize: "STRETCH"
    backgroundColor: string
  }
  renderPreview?: () => React.ReactElement
  shouldWaitForMenuToHideBeforeFiringOnPressMenuItem?: boolean
  onPressMenuItem?: (args: { nativeEvent: { actionKey: string } }) => void
  onPressMenuPreview?: () => void
  onMenuWillShow?: () => void
  onMenuWillHide?: () => void
  style?: StyleProp<ViewStyle>
  hitSlop?: number
  children: React.ReactNode
}

export type IMenuActionConfig = {
  actionKey: string
  actionTitle: string
  icon: {
    iconType: "SYSTEM"
    iconValue: string
    iconTint?: string
  }
  menuAttributes?: "destructive"[]
}
