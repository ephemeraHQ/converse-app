## SpecStory

## Update Read/Unread Status Logic (1/14/2025, 9:56:01 AM)

_**User**_

fix this, if the conversation is unread and we mark as Read we update the readUntil but if it was already read, we put the readuntil 1 ms before the last message so that it shows as unread

---

_**Assistant**_

I'll help modify the code to handle the read/unread status correctly. Here are the key changes needed:

```typescript:features/conversation-list/hooks/use-toggle-read-status.ts
// ... existing imports ...

export const useToggleReadStatus = ({ topic }: UseToggleReadStatusProps) => {
  const { mutateAsync: toggleReadStatusAsync } = useMutation({
    mutationFn: async () => {
      const currentAccount = getCurrentAccount();
      const [conversationData, conversation] = await Promise.all([
        getOrFetchConversationData({
          account: currentAccount!,
          topic,
          context: "useToggleReadStatus",
        }),
        getConversationQueryData({
          account: currentAccount!,
          topic,
          context: "useToggleReadStatus",
        }),
      ]);

      const lastMessageTime = conversation?.lastMessage?.sentNs ?? 0;
      const convoIsUnread = conversationIsUnread({
        lastMessageSent: lastMessageTime,
        readUntil: conversationData?.readUntil ?? 0,
      });

      if (convoIsUnread) {
        // Mark as read - set readUntil to current time
        await markTopicAsRead({
          account: currentAccount!,
          topic,
          readUntil: new Date().getTime(),
        });
      } else {
        // Mark as unread - set readUntil to just before the last message
        await markTopicAsUnread({
          account: currentAccount!,
          topic,
          readUntil: Math.max(0, lastMessageTime - 1), // Ensure we don't go negative
        });
      }
    },
    // ... rest of the mutation config ...
```

The main changes are:
1. Store the `lastMessageTime` in a variable for reuse
2. When marking as unread, we now set the `readUntil` timestamp to 1ms before the last message time instead of just calling `markTopicAsUnread` without a timestamp
3. Added `Math.max(0, ...)` to ensure we don't accidentally set a negative timestamp

This will ensure that:
- When marking as read, the conversation shows as read (readUntil > lastMessage time)
- When marking as unread, the conversation shows as unread (readUntil < lastMessage time)

---

_**User**_

but even fix the onMutate and onError

---

_**Assistant**_

I'll help fix the `onMutate` and `onError` to properly handle the read/unread status:

```typescript:features/conversation-list/hooks/use-toggle-read-status.ts
// ... existing code ...

export const useToggleReadStatus = ({ topic }: UseToggleReadStatusProps) => {
  const { mutateAsync: toggleReadStatusAsync } = useMutation({
    // ... existing mutationFn ...
    onMutate: async () => {
      const currentAccount = getCurrentAccount();
      const [conversationData, conversation] = await Promise.all([
        getConversationDataQueryData({
          account: currentAccount!,
          topic,
          context: "useToggleReadStatus",
        }),
        getConversationQueryData({
          account: currentAccount!,
          topic,
          context: "useToggleReadStatus",
        }),
      ]);

      const lastMessageTime = conversation?.lastMessage?.sentNs ?? 0;
      const convoIsUnread = conversationIsUnread({
        lastMessageSent: lastMessageTime,
        readUntil: conversationData?.readUntil ?? 0,
      });

      const previousReadUntil = conversationData?.readUntil;

      // Update the cache with the new readUntil value
      setConversationDataQueryData({
        account: currentAccount!,
        topic,
        context: "useToggleReadStatus",
        data: {
          readUntil: convoIsUnread 
            ? new Date().getTime() 
            : Math.max(0, lastMessageTime - 1),
        },
      });

      return { 
        previousReadUntil,
        wasUnread: convoIsUnread 
      };
    },
    onError: (error, _, context) => {
      const currentAccount = getCurrentAccount();
      captureError(error);
      
      // Revert to the previous readUntil value
      setConversationDataQueryData({
        account: currentAccount!,
        topic,
        context: "useToggleReadStatus",
        data: {
          readUntil: context?.previousReadUntil,
        },
      });
      
      captureErrorWithToast(error);
    },
  });

  return { toggleReadStatusAsync };
};
```

Key changes:
1. `onMutate` now:
   - Fetches both conversation data and conversation to determine current read status
   - Updates the cache with the appropriate `readUntil` value based on current status
   - Returns both the previous `readUntil` and the previous unread status for rollback
2. `onError` remains similar but now has access to the correct previous state for rollback

This ensures that:
- The UI updates immediately with the correct read/unread status
- The cache is properly updated with the correct `readUntil` timestamp
- On error, we can properly rollback to the previous state

---



---

