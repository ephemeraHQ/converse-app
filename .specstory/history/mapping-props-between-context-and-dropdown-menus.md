## SpecStory

## Mapping Props Between Context and Dropdown Menus (2/3/2025, 1:25:26 PM)

_**User**_

look at props that @dropdown-menu.tsx takes and map the @context-menu.types.ts  to those

---

_**Assistant**_

I'll help map the context menu props to the dropdown menu props. We need to transform the `IContextMenuViewProps` structure to match `IDropdownMenuProps`. The main task is to convert `menuConfig.menuItems` into the `actions` format that DropdownMenu expects.

Here's the updated context menu code:

```typescript:design-system/context-menu/context-menu.android.tsx
import { DropdownMenu } from "@/design-system/dropdown-menu/dropdown-menu";
import { memo } from "react";
import type { IContextMenuViewProps } from "./context-menu.types";

export const ContextMenuView = memo(function ContextMenuView(
  props: IContextMenuViewProps
) {
  const { menuConfig, onPressMenuItem, children, style } = props;

  // Transform menuConfig.menuItems into DropdownMenu actions format
  const actions = menuConfig.menuItems.map((item) => ({
    id: item.actionKey,
    title: item.actionTitle,
    // Map system icon
    systemIcon: item.icon.iconValue,
    // Map destructive attribute to red color
    color: item.menuAttributes?.includes("destructive") 
      ? "red" 
      : item.icon.iconTint,
  }));

  const handlePress = (actionId: string) => {
    onPressMenuItem?.({ 
      nativeEvent: { actionKey: actionId } 
    });
  };

  return (
    <DropdownMenu 
      actions={actions}
      style={style}
      onPress={handlePress}
    >
      {children}
    </DropdownMenu>
  );
});
```

Key changes made:
1. Transformed `menuConfig.menuItems` into the `actions` format that DropdownMenu expects
2. Mapped `actionKey` to `id`
3. Mapped `actionTitle` to `title` 
4. Mapped `icon.iconValue` to `systemIcon`
5. Added color handling for destructive menu items and icon tints
6. Created a handler to transform the onPress callback to match the expected context menu format
7. Passed through style and children props directly

The main transformation is converting the menu items structure while preserving the functionality and appearance as much as possible between the two different menu implementations.

---



---

