## SpecStory

## Refactoring to useQueries for Spam Checks (1/17/2025, 1:24:16 PM)

_**User**_

ok instead of doing useQuery and having the query key being a map of the converstaionstions let's use useQueries and have queryKey being the topic of each one  and instead of processingConverstionasForSmap we'll just replace with like getIsSpam

---

_**Assistant**_

I'll help you refactor the code to use `useQueries` for individual spam checks. Here's how we can modify the code:

```typescript:features/conversation-requests-list/use-conversation-requests-list-items.tsx
// ... existing code ...

export function useConversationRequestsListItem() {
  const currentAccount = useCurrentAccount();

  const {
    data: unkownConsentConversations,
    isLoading: unkownConsentConversationsLoading,
  } = useQuery({
    ...getUnknownConsentConversationsQueryOptions({
      account: currentAccount!,
      context: "useConversationRequestsListItem",
    }),
  });

  const spamQueries = useQueries({
    queries: (unkownConsentConversations ?? []).map((conversation) => ({
      queryKey: ["spam", conversation.topic],
      queryFn: async () => {
        const lastMessage = conversation.lastMessage!;
        const messageText = getMessageStringContent(lastMessage);
        
        if (!messageText) {
          return true;
        }

        const contentType = getMessageContentType(lastMessage.contentTypeId!);
        if (!contentType) {
          return true;
        }

        try {
          const spamScore = await getV3SpamScore({
            messageText,
            contentType,
          });
          return spamScore !== 0;
        } catch (error) {
          captureError(error);
          return true;
        }
      },
      enabled: !!conversation.lastMessage,
    })),
  });

  const isLoading = unkownConsentConversationsLoading || spamQueries.some(q => q.isLoading);
  const spamResults = spamQueries.map((q, i) => ({
    conversation: unkownConsentConversations?.[i],
    isSpam: q.data ?? true,
  }));

  return {
    likelyNotSpam: spamResults.filter(r => !r.isSpam).map(r => r.conversation) ?? [],
    likelySpam: spamResults.filter(r => r.isSpam).map(r => r.conversation) ?? [],
    isLoading,
  };
}

// Remove processConversationsForSpam function as it's no longer needed
```

Key changes made:
1. Replaced the single spam query with `useQueries` that creates individual queries for each conversation
2. Each query has its own queryKey based on the conversation topic
3. Moved the spam checking logic into the individual query functions
4. Simplified the result processing by mapping over query results
5. Removed the `processConversationsForSpam` function as it's no longer needed

---



---

