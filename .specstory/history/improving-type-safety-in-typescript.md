## SpecStory

## Improving Type Safety in TypeScript (1/8/2025, 11:21:41 AM)

_**User**_

fix the "any" type

---

_**Assistant**_

I'll help fix the `any` type in the `useConversationListStoreForCurrentAccount` function to follow the TypeScript style guide. Here's the change:

```typescript:features/conversation-list/stores/conversation-list.store.tsx
// ... existing code ...

export function useConversationListStoreForCurrentAccount<T>(
  state: (state: StoreState) => T
): T {
  const { data: inboxId } = useCurrentAccountInboxId();
  return useConversationListStore(inboxId!)(state);
}

// ... existing code ...
```

The change replaces `any` with a generic type parameter `T`. This maintains type safety by:
1. Adding a generic type parameter `T` to specify the return type
2. Using that same type `T` as the return type of the state selector function
3. Properly typing the function's return value as `T`

This way, TypeScript will properly infer the return type based on what the selector function returns, maintaining type safety throughout the application.

---



---

