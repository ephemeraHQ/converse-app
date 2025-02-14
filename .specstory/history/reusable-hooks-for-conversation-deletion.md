## SpecStory

## Reusable Hooks for Conversation Deletion (1/22/2025, 4:40:15 PM)

_**User**_

create 2 hooks, 1 for group and one for dm and try to reuse as most stuff 

---

_**Assistant**_

I'll help you split this into two separate hooks while reusing common functionality. Here's how we can refactor it:

```typescript:features/conversation-list/hooks/use-conversation-list-item-context-menu-default-props.tsx
// ... existing code ...

// Common hook for shared delete menu item logic
function useBaseDeleteMenuItem(args: {
  onDelete: () => Promise<void>;
}): Omit<IUseContextMenuItem, 'onPress'> {
  const { theme } = useAppTheme();

  return {
    actionKey: "delete",
    actionTitle: translate("delete"),
    icon: {
      iconType: "SYSTEM",
      iconValue: iconRegistry["trash"],
      iconTint: theme.colors.global.caution,
    },
    menuAttributes: ["destructive"],
  };
}

function useGroupDeleteMenuItem(args: {
  conversationTopic: ConversationTopic;
}): IUseContextMenuItem {
  const { conversationTopic } = args;
  const deleteGroup = useDeleteGroup({ groupTopic: conversationTopic });

  const handleDelete = useCallback(async () => {
    try {
      await deleteGroup();
    } catch (error) {
      captureErrorWithToast(error, {
        message: "Error deleting group",
      });
    }
  }, [deleteGroup]);

  return {
    ...useBaseDeleteMenuItem({ onDelete: handleDelete }),
    onPress: handleDelete,
  };
}

function useDmDeleteMenuItem(args: {
  conversationTopic: ConversationTopic;
}): IUseContextMenuItem {
  const { conversationTopic } = args;
  const deleteDm = useDeleteDm({ topic: conversationTopic });

  const handleDelete = useCallback(async () => {
    try {
      await deleteDm();
    } catch (error) {
      captureErrorWithToast(error, {
        message: "Error deleting conversation",
      });
    }
  }, [deleteDm]);

  return {
    ...useBaseDeleteMenuItem({ onDelete: handleDelete }),
    onPress: handleDelete,
  };
}

function useConversationContextMenuDeleteItem(args: {
  conversationTopic: ConversationTopic;
}): IUseContextMenuItem {
  const { conversationTopic } = args;
  const currentAccount = useCurrentAccount();

  const { data: conversation } = useConversationQuery({
    account: currentAccount!,
    topic: conversationTopic,
    caller: "useConversationContextMenuDeleteItem",
  });

  const groupMenuItem = useGroupDeleteMenuItem({ conversationTopic });
  const dmMenuItem = useDmDeleteMenuItem({ conversationTopic });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  return isConversationGroup(conversation) ? groupMenuItem : dmMenuItem;
}

// ... existing code ...
```

Key changes made:
1. Created a `useBaseDeleteMenuItem` hook that contains the shared menu item configuration
2. Created separate `useGroupDeleteMenuItem` and `useDmDeleteMenuItem` hooks for specific deletion logic
3. Modified `useConversationContextMenuDeleteItem` to use the appropriate hook based on conversation type
4. Each hook now has its own error handling with specific error messages
5. Removed the nested try-catch in the main hook and moved error handling to the specific hooks
6. Simplified the logic by removing unnecessary conditional checks

The code is now more modular and follows the single responsibility principle better, while still maintaining the same functionality.

---



---

