## SpecStory

## Fixing useQueries and useMemo Error (1/29/2025, 9:49:02 AM)

_**User**_

For the code present, we get this error:
```
The result of useQueries is not referentially stable, so don't pass it directly into the dependencies array of useMemo. Instead, destructure the return value of useQueries and pass the destructured values into the dependency array of useMemo.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

I'll help you fix the referential stability issue with `useQueries`. Here's the concise solution:

```typescript:features/conversation-list/use-conversation-list-conversations.tsx
// ... existing code ...

  const conversationsMetadataQueries = useQueries({
    queries: (conversations ?? []).map((conversation) =>
      getConversationMetadataQueryOptions({
        account: currentAccount!,
        topic: conversation.topic,
      })
    ),
  });

  // Extract stable values from queries
  const queriesData = useMemo(
    () => conversationsMetadataQueries.map((q) => ({ 
      data: q.data,
      isLoading: q.isLoading 
    })),
    [conversationsMetadataQueries]
  );

  const filteredAndSortedConversations = useMemo(() => {
    if (!conversations) return [];

    const filtered = conversations.filter((conversation, index) => {
      const query = queriesData[index];
      const isAllowed = isConversationAllowed(conversation);
      const isPinned = query?.data?.isPinned;
      const isDeleted = query?.data?.isDeleted;
      const isLoading = query?.isLoading;

      return isAllowed && !isPinned && !isDeleted && !isLoading;
    });

    return filtered.sort((a, b) => {
      const timestampA = a.lastMessage?.sentNs ?? 0;
      const timestampB = b.lastMessage?.sentNs ?? 0;
      return timestampB - timestampA;
    });
  }, [conversations, queriesData]);

// ... existing code ...
```

The fix creates a stable reference by extracting only the needed properties from `conversationsMetadataQueries` into `queriesData` using `useMemo`, then uses that stable reference in the dependency array of the filtering/sorting memo.

---



---

