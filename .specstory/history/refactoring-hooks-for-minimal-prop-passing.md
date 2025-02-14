## SpecStory

## Refactoring Hooks for Minimal Prop Passing (1/7/2025, 12:53:22 PM)

_**User**_

reuse hooks don't pass props or argument. Or at least as less as possible

---

_**Assistant**_

I'll help you refactor these hooks to minimize prop passing. We can use the chat store directly within the hooks instead of passing arguments.

Here's the refactored version:

```typescript:features/conversation-list/PinnedConversations/PinnedConversations.tsx
// ... existing code ...

function useConversationContextMenuPinItem(): IUseContextMenuItem {
  const { setPinnedConversations } = useChatStore(
    useSelect(["setPinnedConversations"])
  );
  const conversationTopic = useSelect((s) => s.currentConversationTopic);

  return {
    actionKey: "pin",
    actionTitle: translate("pin"),
    icon: {
      iconType: "SYSTEM",
      iconValue: "pin",
    },
    onPress: () => setPinnedConversations([conversationTopic]),
  };
}

function useConversationContextMenuReadItem(): IUseContextMenuItem {
  const conversationTopic = useSelect((s) => s.currentConversationTopic);
  const isUnread = useSelect((s) => s.isConversationUnread(conversationTopic));
  const toggleReadStatus = useToggleReadStatus();

  return {
    actionKey: "markAsUnread",
    actionTitle: isUnread
      ? translate("mark_as_read")
      : translate("mark_as_unread"),
    icon: {
      iconType: "SYSTEM",
      iconValue: isUnread ? "checkmark.message" : "message.badge",
    },
    onPress: toggleReadStatus,
  };
}

// ... existing delete item hook stays the same ...

const PinnedConversationContextMenu = memo(
  function PinnedConversationContextMenu() {
    const { theme } = useAppTheme();
    const pinMenuItem = useConversationContextMenuPinItem();
    const readMenuItem = useConversationContextMenuReadItem();
    const deleteMenuItem = useConversationContextMenuDeleteItem();

    const menuItems = [
      pinMenuItem,
      readMenuItem,
      deleteMenuItem,
      ...(additionalMenuActions ?? []),
    ];

    // ... rest of the component stays the same ...
  }
);
```

Key changes made:
1. Removed props from `useConversationContextMenuPinItem` and `useConversationContextMenuReadItem`
2. Used `useSelect` to get values directly from the store
3. Simplified the component by removing prop passing to hooks
4. Assumed the existence of `currentConversationTopic` and `isConversationUnread` in the store (you may need to add these if they don't exist)

This approach follows the principle of minimizing prop drilling and makes the hooks more self-contained and reusable.

---



---

