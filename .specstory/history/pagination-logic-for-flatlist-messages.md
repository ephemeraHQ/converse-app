## SpecStory

## Pagination Logic for FlatList Messages (1/17/2025, 8:56:15 AM)

_**User**_

I want logic where we'll be passing more messages to the flatlist when we scroll up. Meaning at first I want 10 messages and when onEndReached is called on the Flatlist, we can render 10 more etc...

---

_**Assistant**_

I'll help you implement pagination for the messages. We'll need to modify the Messages component and the useConversationMessages query. Here's how to update the code:

```typescript:features/conversation/conversation.tsx
// ... existing code ...

const Messages = memo(function Messages(props: {
  conversation: ConversationWithCodecsType;
}) {
  const { conversation } = props;

  const currentAccount = useCurrentAccount()!;
  const { data: currentAccountInboxId } = useCurrentAccountInboxId();
  const topic = useCurrentConversationTopic()!;

  const refreshingRef = useRef(false);
  const [pageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: messages,
    isLoading: messagesLoading,
    isRefetching: isRefetchingMessages,
    refetch: refetchMessages,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useConversationMessages(currentAccount, topic!, {
    pageSize,
    currentPage,
  });

  // ... existing useEffects and other logic ...

  const handleLoadMore = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage) {
      setCurrentPage(prev => prev + 1);
      fetchNextPage();
    }
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  return (
    <ConversationMessagesList
      messages={allMessages}
      refreshing={isRefetchingMessages}
      onRefresh={Platform.OS === "android" ? refetchMessages : undefined}
      onScroll={onScroll}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={
        isConversationDm(conversation) ? (
          <DmConversationEmpty />
        ) : (
          <GroupConversationEmpty />
        )
      }
      // ... rest of the existing props ...
    />
  );
});

// ... existing code ...
```

You'll need to update your `useConversationMessages` query to handle pagination. Here's a suggested implementation:

```typescript:queries/use-conversation-messages-query.ts
export function useConversationMessages(
  account: IAccount,
  topic: ConversationTopic,
  { pageSize, currentPage }: { pageSize: number; currentPage: number }
) {
  return useInfiniteQuery({
    queryKey: ['conversation-messages', topic, account.id],
    queryFn: async ({ pageParam = 1 }) => {
      // Fetch messages with pagination
      const messages = await client.conversations.list({
        // Add your pagination parameters here based on your API
        limit: pageSize,
        page: pageParam,
      });
      
      return {
        messages,
        nextPage: pageParam + 1,
        hasMore: messages.length === pageSize,
      };
    },
    getNextPageParam: (lastPage) => 
      lastPage.hasMore ? lastPage.nextPage : undefined,
    initialPageParam: 1,
  });
}
```

This implementation:
1. Adds pagination state with a default page size of 10 messages
2. Uses `onEndReached` to trigger loading more messages when scrolling up
3. Implements infinite query functionality using `useInfiniteQuery`
4. Only loads more messages if there are more available and we're not already loading

Note: You'll need to adjust the actual API call in `useConversationMessages` based on your XMTP client's pagination API. The example assumes a standard pagination interface, but you'll need to modify it according to your actual API structure.

---



---

