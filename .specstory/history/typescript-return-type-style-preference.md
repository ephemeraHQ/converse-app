## SpecStory

## TypeScript Return Type Style Preference (1/7/2025, 2:35:34 PM)

_**User**_

I want to create rule to describe that I prefer doing reutrn{...} as IUseContextMenuItem then specifying a reutnr like :IUseContextMenuItem

---

_**Assistant**_

I understand you want to establish a code style rule that prefers explicit type annotations in the return statement rather than in the function signature. Here's how we can modify the code to follow this pattern:

```typescript:features/conversation-list/components/conversation-list-item-context-menu/conversation-list-item-context-menu.utils.tsx
// ... existing imports ...

export function useConversationContextMenuPinItem(args: {
  conversationTopic: ConversationTopic;
}) {
  const { conversationTopic } = args;

  const { setPinnedConversations } = useChatStore(
    useSelect(["setPinnedConversations"])
  );

  return {
    actionKey: "pin",
    actionTitle: translate("pin"),
    icon: {
      iconType: "SYSTEM",
      iconValue: "pin",
    },
    onPress: () => setPinnedConversations([conversationTopic]),
  } as IUseContextMenuItem;
}
```

The key changes are:
1. Removed the return type annotation `: IUseContextMenuItem` from the function signature
2. Added `as IUseContextMenuItem` to the return statement

This style can be clearer as it puts the type information closer to where it's actually used and makes it more explicit what shape the returned object should have. You might want to add this to your style guide under the TypeScript section:

```markdown
- Prefer type assertions on return objects (`return {...} as IType`) over function return type annotations (`function(): IType`)
```

---



---

