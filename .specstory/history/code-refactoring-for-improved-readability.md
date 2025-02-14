## SpecStory

## Code Refactoring for Improved Readability (1/20/2025, 9:09:15 PM)

_**User**_

anyway to make thie cleaner?

---

_**Assistant**_

I'll help you clean up this code. Here's a refactored version that's more readable and follows the style guide better:

```typescript:features/conversation-requests-list/use-conversation-requests-list-items.tsx
// ... existing code ...

export function useConversationRequestsListItem() {
  const currentAccount = useCurrentAccount();

  // Query for unknown consent conversations
  const {
    data: unkownConsentConversations,
    isLoading: unkownConsentConversationsLoading,
  } = useQuery({
    ...getUnknownConsentConversationsQueryOptions({
      account: currentAccount!,
      context: "useConversationRequestsListItem",
    }),
  });

  // Helper function to check if a message is spam
  function checkMessageSpam({ lastMessage }: { lastMessage: any }) {
    if (!lastMessage) {
      return true;
    }

    const messageText = getMessageStringContent(lastMessage);
    if (!messageText) {
      return true;
    }

    const contentType = getMessageContentType(lastMessage.contentTypeId!);
    if (!contentType) {
      return true;
    }

    return getV3SpamScore({ messageText, contentType })
      .then((spamScore) => spamScore !== 0)
      .catch((error) => {
        captureError(error);
        return true;
      });
  }

  // Spam detection queries
  const spamQueries = useQueries({
    queries: (unkownConsentConversations ?? []).map((conversation) => ({
      queryKey: ["is-spam", conversation.topic],
      queryFn: () => checkMessageSpam({ lastMessage: conversation.lastMessage }),
      enabled: !!conversation.lastMessage,
    })),
  });

  const isLoading = 
    unkownConsentConversationsLoading || 
    spamQueries.some((q) => q.isLoading);

  // Process results
  const spamResults = spamQueries
    .map((q, i) => ({
      conversation: unkownConsentConversations?.[i],
      isSpam: q.data ?? true,
    }))
    .filter((r) => !!r.conversation);

  return {
    likelyNotSpam: spamResults
      .filter((r) => !r.isSpam)
      .map((r) => r.conversation!),
    likelySpam: spamResults
      .filter((r) => r.isSpam)
      .map((r) => r.conversation!),
    isLoading,
  };
}
```

Key improvements made:

1. Extracted the spam checking logic into a separate helper function `checkMessageSpam` for better readability and maintainability
2. Added spacing between logical blocks to improve readability
3. Simplified the spam checking function by using promise chaining
4. Added comments to explain the different sections of the code
5. Removed unnecessary null coalescing operators in the return statement since the filter ensures non-null values
6. Used object parameter for the helper function following the style guide

The code is now more organized and easier to understand while maintaining the same functionality. The separation of concerns is clearer with the spam checking logic isolated in its own function.

---



---

