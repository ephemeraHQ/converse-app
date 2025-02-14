## SpecStory

## Fixing TypeScript Hook Issue (1/7/2025, 2:38:23 PM)

_**User**_

prefet return as

---

_**Assistant**_

I notice there's an issue with the `useConversationContextMenuReadItem` hook where `isUnread` is being used but not defined. Here's how to fix it:

```typescript:features/conversation-list/components/conversation-list-item-context-menu/conversation-list-item-context-menu.utils.tsx
export function useConversationContextMenuReadItem(args: {
  conversationTopic: ConversationTopic;
  isUnread: boolean;
}): IUseContextMenuItem {
  const { conversationTopic, isUnread } = args;

  const currentAccount = useCurrentAccount();

  const toggleReadStatus = useToggleReadStatus({
    topic: conversationTopic,
    isUnread,
    currentAccount: currentAccount,
  });
  // ... rest of the function
}
```

The changes:
1. Added `isUnread: boolean` to the args type definition
2. Destructured `isUnread` from args along with `conversationTopic`

This follows the TypeScript style guide by:
- Using object params instead of individual parameters
- Properly typing all parameters
- Using destructuring for args

The rest of the code looks good and follows the style guidelines, including the use of the theme in the delete item hook.

---



---

