## SpecStory

## Sorting Conversations by Last Message Timestamp (1/16/2025, 7:37:44 PM)

_**User**_

when i fifrst fetch conversations it gives them to me ordered by lastMessage timestamp, then i update the query cache of those conversations, how can i always make sure they are ordered by lastMessage

---

_**Assistant**_

I'll help you modify the code to ensure conversations remain sorted by lastMessage timestamp. We'll need to add sorting in the `useMemo` where we filter the conversations.

```typescript:features/conversation-list/use-conversation-list-conversations.tsx
// ... existing code ...

  const conversationsFiltered = useMemo(() => {
    if (!conversations) return [];

    return conversations
      .filter((conversation, index) => {
        const query = conversationsDataQueries[index];
        return (
          isConversationAllowed(conversation) &&
          !query?.data?.isPinned &&
          !query?.data?.isDeleted &&
          !query?.isLoading
        );
      })
      // Sort conversations by lastMessage timestamp in descending order (newest first)
      .sort((a, b) => {
        const indexA = conversations.findIndex((c) => c.topic === a.topic);
        const indexB = conversations.findIndex((c) => c.topic === b.topic);
        const queryA = conversationsDataQueries[indexA];
        const queryB = conversationsDataQueries[indexB];
        
        const timestampA = queryA?.data?.lastMessage?.timestamp ?? 0;
        const timestampB = queryB?.data?.lastMessage?.timestamp ?? 0;
        
        return timestampB - timestampA;
      });
  }, [conversations, conversationsDataQueries]);

// ... existing code ...
```

I've added a sort operation after the filter. The sort compares the `lastMessage.timestamp` from the conversation metadata queries. A few notes about the implementation:

1. We need to find the correct index in `conversationsDataQueries` for each conversation being compared since the filtered array indices won't match the original array indices
2. We use the nullish coalescing operator (`??`) to default to 0 if there's no lastMessage timestamp
3. We sort in descending order (newest first) by subtracting timestampA from timestampB
4. The sort will maintain the original order for conversations with the same timestamp

This will ensure the conversations are always sorted by lastMessage timestamp, even after cache updates.

---



---

