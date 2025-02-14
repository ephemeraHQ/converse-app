## SpecStory

## Fixing Missing Dependencies in React Query (1/20/2025, 9:18:14 PM)

_**User**_

make this cleawhy do i get " 19:5  error  The following dependencies are missing in your queryKey: conversation  @tanstack/query/exhaustive-deps"

---

_**Assistant**_

The error you're seeing is coming from the ESLint plugin for React Query (`@tanstack/query/exhaustive-deps`). It's occurring in your `useDmPeerInbox.ts` file because the query function depends on the `conversation` variable, but `conversation` is not included in the query key.

Here's how to fix it:

```typescript:queries/useDmPeerInbox.ts
// ... existing code ...
  return useQuery({
    queryKey: dmPeerInboxIdQueryKey(account, topic),
    queryFn: () => {
      if (!conversation) {
        throw new Error("Conversation not found");
      }
      if (!isConversationDm(conversation)) {
        throw new Error("Conversation is not a DM");
      }
      return conversation.peerInboxId();
    },
    enabled: !!account && !!topic && !!conversation,
  });
```

The issue is that when `conversation` changes, you want the query to re-run, but since `conversation` isn't in the query key, React Query doesn't know to invalidate and re-run the query when `conversation` changes.

Here's the fix:

```typescript:queries/useDmPeerInbox.ts
// ... existing code ...
  return useQuery({
    queryKey: [...dmPeerInboxIdQueryKey(account, topic), conversation?.id],
    queryFn: () => {
      if (!conversation) {
        throw new Error("Conversation not found");
      }
      if (!isConversationDm(conversation)) {
        throw new Error("Conversation is not a DM");
      }
      return conversation.peerInboxId();
    },
    enabled: !!account && !!topic && !!conversation,
  });
```

The changes:
1. Added `conversation?.id` to the query key array
2. Used spread operator to combine with existing query key

This ensures that:
- The query will properly re-run when the conversation changes
- The query key remains unique for each conversation
- We satisfy the ESLint rule by including all dependencies in the query key

Note: If `conversation` doesn't have an `id` property, you can use another unique identifier or the entire `conversation` object (though using the whole object in query keys is generally not recommended).

---



---

