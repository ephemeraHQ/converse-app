## SpecStory

## Improving Loading State in Code (1/17/2025, 9:58:53 AM)

_**User**_

 need to make this better... I want the isLoading, but the rpboem is i want the isLoading to reflect also when we finished processingCovnersations

---

_**Assistant**_

I'll help modify the code to track both the query loading state and the processing state. Here's how we can improve it:

```typescript:features/conversation-requests-list/use-conversation-requests-list-items.tsx
// ... existing code ...

export const useConversationRequestsListItem = () => {
  const currentAccount = useCurrentAccount();
  const [isProcessing, setIsProcessing] = useState(false);

  const [likelyNotSpam, setLikelyNotSpam] = useState<ConversationWithCodecsType[]>([]);
  const [likelySpam, setLikelySpam] = useState<ConversationWithCodecsType[]>([]);

  const { data: conversations, isLoading: isQueryLoading } = useQuery(
    getUnknownConsentConversationsQueryOptions({
      account: currentAccount!,
      context: "useConversationRequestsListItem",
    })
  );

  // ... existing code ...

  useEffect(() => {
    async function processConversations(conversations: ConversationWithCodecsType[]) {
      try {
        setIsProcessing(true);
        // ... existing processing code ...
      } catch (error) {
        captureErrorWithToast(error);
      } finally {
        setIsProcessing(false);
      }
    }

    processConversations(conversations ?? []);
  }, [numberOfConversations]);

  const isLoading = isQueryLoading || isProcessing;

  return { likelyNotSpam, likelySpam, isLoading };
};
```

Key changes made:
1. Added `isProcessing` state to track when we're processing conversations
2. Renamed the query's `isLoading` to `isQueryLoading` for clarity
3. Added `setIsProcessing(true)` at the start of processing and `setIsProcessing(false)` in a `finally` block
4. Combined both loading states into `isLoading = isQueryLoading || isProcessing`

This will now correctly reflect the loading state for both the initial query and the spam processing phase.

---



---

