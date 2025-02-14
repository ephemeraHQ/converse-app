## SpecStory

## Custom Hooks for Menu Items (1/7/2025, 12:49:07 PM)

_**User**_

create custom hooks in same file for each menuItem. example, useConversationContextMenuPinItem, etc...

---

_**Assistant**_

I'll help you extract the menu items into custom hooks within the same file. Here's how we can refactor the code:

```typescript:features/conversation-list/PinnedConversations/PinnedConversations.tsx
// ... existing imports ...

type IUseContextMenuItem = {
  actionKey: string;
  actionTitle: string;
  icon: {
    iconType: "SYSTEM";
    iconValue: string;
    iconTint?: string;
  };
  menuAttributes?: string[];
  onPress: () => void;
};

function useConversationContextMenuPinItem(args: { 
  conversationTopic: string,
  setPinnedConversations: (topics: string[]) => void 
}): IUseContextMenuItem {
  const { conversationTopic, setPinnedConversations } = args;
  
  return {
    actionKey: "pin",
    actionTitle: translate("pin"),
    icon: {
      iconType: "SYSTEM",
      iconValue: "pin",
    },
    onPress: () => setPinnedConversations([conversationTopic])
  };
}

function useConversationContextMenuReadItem(args: {
  isUnread: boolean,
  toggleReadStatus: () => void
}): IUseContextMenuItem {
  const { isUnread, toggleReadStatus } = args;
  
  return {
    actionKey: "markAsUnread",
    actionTitle: isUnread ? translate("mark_as_read") : translate("mark_as_unread"),
    icon: {
      iconType: "SYSTEM",
      iconValue: isUnread ? "checkmark.message" : "message.badge",
    },
    onPress: toggleReadStatus
  };
}

function useConversationContextMenuDeleteItem(): IUseContextMenuItem {
  const { theme } = useAppTheme();
  
  return {
    actionKey: "delete",
    actionTitle: translate("delete"),
    icon: {
      iconType: "SYSTEM",
      iconValue: "trash",
      iconTint: theme.colors.global.caution,
    },
    menuAttributes: ["destructive"],
    onPress: () => {} // TODO: Implement delete functionality
  };
}

const PinnedConversationContextMenu = memo(function PinnedConversationContextMenu() {
  const { theme } = useAppTheme();
  const { setPinnedConversations } = useChatStore(
    useSelect(["setPinnedConversations"])
  );

  const toggleReadStatus = useToggleReadStatus({
    topic: conversationTopic,
    isUnread,
    currentAccount: currentAccount,
  });

  const pinMenuItem = useConversationContextMenuPinItem({
    conversationTopic,
    setPinnedConversations
  });
  
  const readMenuItem = useConversationContextMenuReadItem({
    isUnread,
    toggleReadStatus
  });
  
  const deleteMenuItem = useConversationContextMenuDeleteItem();

  const menuItems = [
    pinMenuItem,
    readMenuItem,
    deleteMenuItem,
    ...(additionalMenuActions ?? []),
  ];

  return <ContextMenuView
    previewConfig={{
      previewType: "CUSTOM",
      previewSize: "STRETCH",
      backgroundColor: "white",
    }}
    menuConfig={{
      menuTitle: "",
      menuItems,
    }}
    renderPreview={() => (
      <VStack
        style={{
          paddingBottom: theme.spacing.xs,
          flex: 1,
        }}
      >
        <ConversationReadOnly topic={conversationTopic} />
      </VStack>
    )}
    onPressMenuItem={(event) => {
      const menuItem = menuItems.find(
        (item) => item.actionKey === event.nativeEvent.actionKey
      );
      menuItem?.onPress();
    }}
    onPressMenuPreview={(event) => {
      // TODO
    }}
  >
    {children}
  </ContextMenuView>
});
```

Key changes made:
1. Created an `IUseContextMenuItem` type to define the structure of menu items
2. Created three custom hooks for each menu item:
   - `useConversationContextMenuPinItem`
   - `useConversationContextMenuReadItem`
   - `useConversationContextMenuDeleteItem`
3. Simplified the menu items array by using the hooks
4. Simplified the `onPressMenuItem` handler to use the `onPress` functions from the menu items

Each hook encapsulates the logic for its specific menu item, making the code more modular and easier to maintain. The hooks follow the style guide by using TypeScript types and object parameters.

Note: You'll need to implement the delete functionality in `useConversationContextMenuDeleteItem` as it's currently empty.

---



---

