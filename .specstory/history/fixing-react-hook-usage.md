## SpecStory

## Fixing React Hook Usage (1/20/2025, 8:52:14 PM)

_**User**_

fix this, we can't render hooks like that...

---

_**Assistant**_

Ah yes, we need to fix the conditional hook usage which violates React's rules of hooks. We should move the hooks outside the conditional and then determine which delete function to use. Here's the corrected version:

```typescript:features/conversation-list/hooks/use-conversation-list-item-context-menu-default-props.tsx
// ... existing code ...

function useConversationContextMenuDeleteItem(args: {
  conversationTopic: ConversationTopic;
}): IUseContextMenuItem {
  const { conversationTopic } = args;
  const currentAccount = useCurrentAccount();
  const { theme } = useAppTheme();

  const { data: conversation } = useConversationQuery({
    account: currentAccount!,
    topic: conversationTopic,
  });

  const deleteGroup = useDeleteGroup({ groupTopic: conversationTopic });
  const deleteDm = useDeleteDm({ topic: conversationTopic });

  const handleDelete = () => {
    if (!conversation) return;
    if (isConversationGroup(conversation)) {
      deleteGroup();
    } else {
      deleteDm();
    }
  };

  return {
    actionKey: "delete",
    actionTitle: translate("delete"),
    icon: {
      iconType: "SYSTEM",
      iconValue: iconRegistry["trash"],
      iconTint: theme.colors.global.caution,
    },
    menuAttributes: ["destructive"],
    onPress: handleDelete,
  } satisfies IUseContextMenuItem;
}

// ... existing code ...
```

The key changes are:
1. Moved both hook calls (`useDeleteGroup` and `useDeleteDm`) outside of the conditional
2. Created a `handleDelete` function that determines which delete function to call based on the conversation type
3. Removed the conditional hook usage that was causing the React hooks violation

This maintains the same functionality while following React's rules of hooks, which require hooks to be called unconditionally at the top level of a component or custom hook.

---



---

