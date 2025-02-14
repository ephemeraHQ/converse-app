## SpecStory

## Refactoring Async Handling in React Query (1/17/2025, 1:16:06 PM)

_**User**_

we can't do async in a select

---

_**Assistant**_

I'll help you modify the code to handle the async processing differently, since using async functions in the `select` option isn't recommended in React Query. We should move the async processing to the query function itself.

Here's how to fix it:

```typescript:features/conversation-requests-list/use-conversation-requests-list-items.tsx
// ... existing code ...

export function useConversationRequestsListItem() {
  const currentAccount = useCurrentAccount();

  const { data, isLoading } = useQuery({
    ...getUnknownConsentConversationsQueryOptions({
      account: currentAccount!,
      context: "useConversationRequestsListItem",
    }),
    select: (data: ProcessedConversations) => {
      return {
        likelyNotSpam: data.likelyNotSpam ?? [],
        likelySpam: data.likelySpam ?? [],
      };
    },
  });

  return {
    likelyNotSpam: data?.likelyNotSpam ?? [],
    likelySpam: data?.likelySpam ?? [],
    isLoading,
  };
}

// ... existing code ...
```

The async processing should be moved to the query function itself in the `getUnknownConsentConversationsQueryOptions`. This way, by the time the data reaches the `select` function, it's already processed and we just need to do synchronous transformations if needed.

The main changes are:
1. Removed the async processing from the `select` function
2. Changed the select to handle already processed data
3. Simplified the return type handling

You'll need to update the `getUnknownConsentConversationsQueryOptions` function to include the spam processing logic, but that would be in a different file.

---



---

