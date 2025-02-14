## SpecStory

## Refactoring Conversation List Context Menu (1/7/2025, 2:16:09 PM)

_**User**_

remove all the menu items, and instead accept menuItems as props Also add the onPress. Remove additionalMenuActions. remove isUnread. remove ConversationTopic. I'm trying to make this conversationListContextMenu generic and reusable

---

_**Assistant**_

I'll help modify the component to make it more generic. Here's the simplified version with the key changes:

```typescript:features/conversation-list/components/conversation-list-item-context-menu/conversation-list-item-context-menu.tsx
import { VStack } from "@/design-system/VStack";
import { useAppTheme } from "@/theme/useAppTheme";
import React, { memo } from "react";
import {
  ContextMenuView,
  MenuActionConfig,
} from "react-native-ios-context-menu";

export const ConversationListContextMenu = memo(
  function ConversationListContextMenu(props: {
    children: React.ReactNode;
    menuItems: (MenuActionConfig & { onPress: () => void })[];
    renderPreview: () => React.ReactNode;
  }) {
    const { children, menuItems, renderPreview } = props;
    const { theme } = useAppTheme();

    return (
      <ContextMenuView
        previewConfig={{
          previewType: "CUSTOM",
          previewSize: "STRETCH",
          backgroundColor: "white",
        }}
        menuConfig={{
          menuTitle: "",
          menuItems: menuItems,
        }}
        renderPreview={() => (
          <VStack
            style={{
              paddingBottom: theme.spacing.xs,
              flex: 1,
            }}
          >
            {renderPreview()}
          </VStack>
        )}
        onPressMenuItem={(event) => {
          const action = menuItems.find(
            (item) => item.actionKey === event.nativeEvent.actionKey
          );
          if (action) {
            action.onPress();
          }
        }}
        onPressMenuPreview={(event) => {
          // TODO
        }}
      >
        {children}
      </ContextMenuView>
    );
  }
);
```

Key changes made:
1. Removed conversation-specific props (conversationTopic, isUnread)
2. Removed additionalMenuActions
3. Added `menuItems` as a prop that accepts an array of menu items with their onPress handlers
4. Made `renderPreview` a prop instead of hardcoding ConversationReadOnly
5. Removed unused imports
6. Simplified the onPressMenuItem handler to work with the new menuItems prop

The component is now more generic and can be used for any context menu scenario, not just conversations.

---



---

