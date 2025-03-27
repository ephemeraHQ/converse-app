// This lib enabled auxiliary view for iOS
import { memo } from "react"
import { ContextMenuView as ContextMenuViewLib } from "react-native-ios-context-menu"
import { IContextMenuViewProps, IMenuActionConfig } from "./context-menu.types"

const ContextMenuView = memo(function ContextMenuView(props: IContextMenuViewProps) {
  return <ContextMenuViewLib {...props} />
})

export { ContextMenuView, IContextMenuViewProps, IMenuActionConfig }
