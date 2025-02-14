## SpecStory

## Error Handling and State Restoration (1/13/2025, 2:29:44 PM)

_**User**_

onError set the readUntil to what it was previously so pass context

---

_**Assistant**_

I'll help you modify the code to preserve the previous `readUntil` value when handling errors. Here's how we can update the code:

```typescript:features/conversation-list/hooks/useToggleReadStatus.ts
// ... existing imports and type definitions ...

export const useToggleReadStatus = ({ topic }: UseToggleReadStatusProps) => {
  // ... existing code ...

  const { mutateAsync: markConversationAsReadAsync } = useMutation({
    mutationFn: async () => {
      await markTopicAsRead({
        account: currentAccount!,
        topic,
        readUntil: new Date().getTime(),
      });
    },
    onMutate: () => {
      // Store previous state before mutation
      const previousData = getConversationQueryData({
        account: currentAccount!,
        topic,
      });

      setConversationDataQueryData({
        account: currentAccount!,
        topic,
        data: {
          readUntil: new Date().getTime(),
        },
      });

      return { previousData };
    },
    onError: (error, _variables, context) => {
      // Restore previous state on error
      setConversationDataQueryData({
        account: currentAccount!,
        topic,
        data: {
          readUntil: context?.previousData?.readUntil,
        },
      });
      captureErrorWithToast(error);
    },
  });

  // ... rest of the code ...
};
```

The changes:
1. Added `previousData` capture in `onMutate` using `getConversationQueryData`
2. Return the context with `previousData` from `onMutate`
3. Updated `onError` to use the previous `readUntil` value from the context instead of setting it to `undefined`

This ensures that if the mutation fails, we restore the conversation's read status to its previous state rather than clearing it completely.

---



---

