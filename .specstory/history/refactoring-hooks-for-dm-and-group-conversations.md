## SpecStory

## Refactoring Hooks for DM and Group Conversations (1/22/2025, 4:45:05 PM)

_**User**_

i need to break useConversationContextMenuViewDefaultProps into 2 hooks one for DM and one for Group. try to reuse as most stuff as possible but on will use useDeleteDm for the delete menu item and the group will use useDeleteGroup for the delete menu item

---

_**Assistant**_

I'll help you break this down into separate hooks for DM and Group conversations while maximizing code reuse. Here's how we can refactor it:

```typescript:features/conversation-list/hooks/use-conversation-list-item-context-menu-default-props.tsx
// ... existing code ...

// Base hook with shared functionality
function useBaseConversationContextMenuViewProps(args: {
  conversationTopic: ConversationTopic;
  deleteMenuItem: IUseContextMenuItem;
}) {
  const { conversationTopic, deleteMenuItem } = args;
  const { theme } = useAppTheme();

  const pinMenuItem = useConversationContextMenuPinItem({ conversationTopic });
  const readMenuItem = useConversationContextMenuReadItem({
    conversationTopic,
  });

  const menuItems = [pinMenuItem, readMenuItem, deleteMenuItem];

  return {
    shouldWaitForMenuToHideBeforeFiringOnPressMenuItem: false,
    menuConfig: {
      menuTitle: "",
      menuItems,
    },
    previewConfig: {
      previewType: "CUSTOM",
      previewSize: "STRETCH",
      backgroundColor: theme.colors.background.surface,
    },
    renderPreview: () => {
      return (
        <VStack
          style={{
            flex: 1,
            paddingBottom: theme.spacing.xs,
          }}
        >
          <ConversationPreview topic={conversationTopic} />
        </VStack>
      );
    },
    onPressMenuItem: (event) => {
      Haptics.selectionAsync();
      const action = menuItems.find(
        (item) => item.actionKey === event.nativeEvent.actionKey
      );
      if (action) {
        action.onPress();
      } else {
        console.warn("No action found for", event.nativeEvent.actionKey);
      }
    },
    onPressMenuPreview: () => {
      // TODO
    },
  } satisfies ContextMenuViewProps;
}

// Specific hook for DM conversations
export function useDmConversationContextMenuViewProps(args: {
  conversationTopic: ConversationTopic;
}) {
  const { conversationTopic } = args;
  const deleteMenuItem = useDmDeleteMenuItem({ conversationTopic });
  
  return useBaseConversationContextMenuViewProps({
    conversationTopic,
    deleteMenuItem,
  });
}

// Specific hook for Group conversations
export function useGroupConversationContextMenuViewProps(args: {
  conversationTopic: ConversationTopic;
}) {
  const { conversationTopic } = args;
  const deleteMenuItem = useGroupDeleteMenuItem({ conversationTopic });
  
  return useBaseConversationContextMenuViewProps({
    conversationTopic,
    deleteMenuItem,
  });
}

// ... existing code ...
```

This refactoring:
1. Creates a base hook `useBaseConversationContextMenuViewProps` that contains all the shared functionality
2. Creates two specific hooks `useDmConversationContextMenuViewProps` and `useGroupConversationContextMenuViewProps` that use the appropriate delete menu item
3. Removes the need for the commented-out `useConversationContextMenuDeleteItem` function
4. Maintains all existing functionality while separating the DM and Group specific logic

The caller would now use either `useDmConversationContextMenuViewProps` or `useGroupConversationContextMenuViewProps` depending on the conversation type, instead of the original `useConversationContextMenuViewDefaultProps`.

---



---

