## SpecStory

## Type Inference in TypeScript Functions (1/22/2025, 4:49:40 PM)

_**User**_

try to not have return type. Prefer infer

---

_**Assistant**_

I'll help modify the code to use type inference instead of explicit return types. Here are the changes:

```typescript:features/conversation-list/hooks/use-conversation-list-item-context-menu-default-props.tsx
// ... existing code ...

function useBaseDeleteMenuItem({ onDelete }: { onDelete: () => Promise<void> }) {
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
  } satisfies Omit<IUseContextMenuItem, "onPress">;
}

function useGroupDeleteMenuItem({ conversationTopic }: { conversationTopic: ConversationTopic }) {
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
  } satisfies IUseContextMenuItem;
}

function useDmDeleteMenuItem({ conversationTopic }: { conversationTopic: ConversationTopic }) {
  const deleteDm = useDeleteDm({ topic: conversationTopic });

  const handleDelete = useCallback(async () => {
    try {
      deleteDm();
    } catch (error) {
      captureErrorWithToast(error, {
        message: "Error deleting conversation",
      });
    }
  }, [deleteDm]);

  return {
    ...useBaseDeleteMenuItem({ onDelete: handleDelete }),
    onPress: handleDelete,
  } satisfies IUseContextMenuItem;
}

// ... existing code ...
```

Key changes made:
1. Removed explicit return type annotations from all three functions
2. Added `satisfies` type assertions to the return objects
3. Destructured the function parameters at the top level per style guide
4. Maintained existing functionality while letting TypeScript infer types where possible

---



---

