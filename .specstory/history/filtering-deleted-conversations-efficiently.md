## SpecStory

## Filtering Deleted Conversations Efficiently (1/13/2025, 2:33:12 PM)

_**User**_

II have a problem here, so I want to filter conversations by the deleted ones. To know if a conversation is deleted I get data with @use-conversation-data-query.ts but the problem is this useQuery is for one conversataion... but here I use many conversations, how cna I do that

---

_**Assistant**_

I understand you want to check the deletion status for multiple conversations efficiently. Instead of making individual queries for each conversation, we can create a new query hook that fetches data for multiple conversations at once. Here's how we can modify the code:

1. First, let's create a new query hook in `use-conversation-data-query.ts`:

```typescript:queries/use-conversation-data-query.ts
// ... existing code ...

// Add this new hook
export const useConversationsDataQuery = (args: { 
  account: string;
  topics: ConversationTopic[];
}) => {
  const { account, topics } = args;
  return useQuery({
    queryKey: ['conversations-data', account, topics],
    queryFn: () => getTopics({ account }),
    enabled: topics.length > 0,
  });
};
```

2. Then modify the conversation list hook:

```typescript:features/conversation-list/conversation-list.screen.tsx
const useConversationListItems = () => {
  const currentAccount = useCurrentAccount();

  const { data: conversations, ...rest } = useConversationListQuery({
    account: currentAccount!,
    context: "conversation-list-screen",
  });

  const { data: conversationsData } = useConversationsDataQuery({
    account: currentAccount!,
    topics: conversations?.map(c => c.topic) ?? [],
  });

  const pinnedConversationTopics = useConversationListStoreForCurrentAccount(
    (s) => s.pinnedConversationTopics
  );

  const conversationsFiltered = useMemo(() => {
    if (!conversations) return [];
    
    const pinnedTopics = new Set(pinnedConversationTopics);
    const deletedTopics = new Set(
      Object.entries(conversationsData ?? {})
        .filter(([_, data]) => data?.status === "deleted")
        .map(([topic]) => topic)
    );

    return conversations.filter((conversation) => {
      const isAllowed = isConversationAllowed(conversation);
      const isNotPinned = !pinnedTopics.has(conversation.topic);
      const isNotDeleted = !deletedTopics.has(conversation.topic);

      return isAllowed && isNotPinned && isNotDeleted;
    });
  }, [conversations, pinnedConversationTopics, conversationsData]);

  return { data: conversationsFiltered, ...rest };
};
```

The key changes are:
1. Removed the dependency on `useChatStore` and `topicsData`
2. Added a new `useConversationsDataQuery` hook that fetches data for all conversations at once
3. Used the query result to filter deleted conversations

This approach is more efficient because:
- It makes a single API call for all conversations instead of individual queries
- It uses React Query's caching capabilities
- It maintains consistency with the existing data fetching patterns in your app

---

_**User**_

is there another way?

---

_**Assistant**_

Yes, there's another approach using React Query's built-in parallel queries feature. Here's how we can do it:

```typescript:features/conversation-list/conversation-list.screen.tsx
const useConversationListItems = () => {
  const currentAccount = useCurrentAccount();

  const { data: conversations, ...rest } = useConversationListQuery({
    account: currentAccount!,
    context: "conversation-list-screen",
  });

  // Use useQueries to fetch data for all conversations in parallel
  const conversationsDataQueries = useQueries({
    queries: (conversations ?? []).map((conversation) => 
      getConversationDataQueryOptions({
        account: currentAccount!,
        topic: conversation.topic,
      })
    ),
  });

  const pinnedConversationTopics = useConversationListStoreForCurrentAccount(
    (s) => s.pinnedConversationTopics
  );

  const conversationsFiltered = useMemo(() => {
    if (!conversations) return [];
    
    const pinnedTopics = new Set(pinnedConversationTopics);
    const deletedTopics = new Set(
      conversationsDataQueries
        .filter((query) => query.data?.status === "deleted")
        .map((query) => query.data?.topic)
    );

    return conversations.filter((conversation) => {
      const isAllowed = isConversationAllowed(conversation);
      const isNotPinned = !pinnedTopics.has(conversation.topic);
      const isNotDeleted = !deletedTopics.has(conversation.topic);

      return isAllowed && isNotPinned && isNotDeleted;
    });
  }, [conversations, pinnedConversationTopics, conversationsDataQueries]);

  return { data: conversationsFiltered, ...rest };
};
```

This approach:
1. Uses React Query's `useQueries` hook to run multiple queries in parallel
2. Leverages your existing `getConversationDataQueryOptions` function
3. Benefits from React Query's automatic batching and caching
4. Maintains individual query states which can be useful for more granular loading/error states

The main difference from the previous solution is that this maintains individual queries per conversation while still being efficient thanks to React Query's optimizations. This might be preferable if:
- You need individual loading/error states
- You want to leverage existing query invalidation logic
- You want to maintain consistency with how conversation data is fetched elsewhere in the app

The tradeoff is that it makes more API calls than the batched approach, but these are automatically managed and optimized by React Query.

---



---

