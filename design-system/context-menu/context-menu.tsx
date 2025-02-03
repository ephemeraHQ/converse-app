// This lib enabled auxiliary view for iOS
import { ContextMenuView as ContextMenuViewLib } from "react-native-ios-context-menu";

import { IContextMenuViewProps, IMenuActionConfig } from "./context-menu.types";
import { memo } from "react";

const ContextMenuView = memo(function ContextMenuView(
  props: IContextMenuViewProps
) {
  return <ContextMenuViewLib {...props} />;
});

export { ContextMenuView, IContextMenuViewProps, IMenuActionConfig };
