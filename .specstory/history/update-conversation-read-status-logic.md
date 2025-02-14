## SpecStory

## Update Conversation Read Status Logic (1/14/2025, 10:22:10 AM)

_**User**_

ok forget about markedAsRead finally... and instead check readUntil and lastMessage to see if the conversation is read or unread. when we markAsUnread, just put a timestamp 1 ms before the lastMessage

---

_**Assistant**_

I'll help modify the code to remove `markedAsRead` and use timestamp comparison instead. Here are the key changes:

```typescript:features/conversation-list/hooks/use-toggle-read-status.ts
// ... existing imports and types ...

function getConversationReadStatus({ topic }: { topic: ConversationTopic }) {
  // ... existing code remains the same ...
}

export const useToggleReadStatus = ({ topic }: UseToggleReadStatusProps) => {
  const { mutateAsync: toggleReadStatusAsync } = useMutation({
    mutationFn: async () => {
      const currentAccount = getCurrentAccount()!;
      const conversation = getConversationQueryData({
        account: currentAccount,
        topic,
        context: "useToggleReadStatus",
      });
      const lastMessageTime = conversation?.lastMessage?.sentNs ?? 0;

      const convoIsUnread = getConversationReadStatus({ topic });

      if (convoIsUnread) {
        await markTopicAsRead({
          account: currentAccount,
          topic,
          readUntil: new Date().getTime(),
        });
      } else {
        // Set readUntil to 1ms before the last message
        await markTopicAsUnread({
          account: currentAccount,
          topic,
          readUntil: Math.max(0, lastMessageTime - 1),
        });
      }
    },
    onMutate: () => {
      const currentAccount = getCurrentAccount()!;
      const previousData = getConversationDataQueryData({
        account: currentAccount,
        topic,
        context: "useToggleReadStatus",
      });

      const convoIsUnread = getConversationReadStatus({ topic });
      const conversation = getConversationQueryData({
        account: currentAccount,
        topic,
        context: "useToggleReadStatus",
      });
      const lastMessageTime = conversation?.lastMessage?.sentNs ?? 0;

      setConversationDataQueryData({
        account: currentAccount,
        topic,
        context: "useToggleReadStatus",
        data: {
          readUntil: convoIsUnread 
            ? new Date().getTime()
            : Math.max(0, lastMessageTime - 1),
        },
      });

      return { previousData };
    },
    // ... onError remains the same ...
  });

  return { toggleReadStatusAsync };
};
```

Key changes made:
1. Removed all references to `markedAsRead`
2. When marking as unread, we now set `readUntil` to 1ms before the last message time
3. Updated both `mutationFn` and `onMutate` to handle the new logic
4. Added `readUntil` parameter to `markTopicAsUnread` call
5. Used `Math.max(0, lastMessageTime - 1)` to ensure we don't get negative timestamps

The conversation's read status is now determined purely by comparing `readUntil` with the last message timestamp, making the logic more consistent and straightforward.

---

_**User**_

lots of duplicate code... can we have a function to centralize this?

---

_**Assistant**_

Yes, let's extract the duplicate logic into a helper function within the same file. Here's the refactored version:

```typescript:features/conversation-list/hooks/use-toggle-read-status.ts
// ... existing imports ...

function getConversationReadStatus({ topic }: { topic: ConversationTopic }) {
  // ... existing code remains the same ...
}

function getToggleReadStatusData({ topic }: { topic: ConversationTopic }) {
  const currentAccount = getCurrentAccount()!;
  const conversation = getConversationQueryData({
    account: currentAccount,
    topic,
    context: "useToggleReadStatus",
  });
  const lastMessageTime = conversation?.lastMessage?.sentNs ?? 0;
  const convoIsUnread = getConversationReadStatus({ topic });
  
  return {
    currentAccount,
    lastMessageTime,
    convoIsUnread,
    newReadUntil: convoIsUnread 
      ? new Date().getTime()
      : Math.max(0, lastMessageTime - 1),
  };
}

export const useToggleReadStatus = ({ topic }: UseToggleReadStatusProps) => {
  const { mutateAsync: toggleReadStatusAsync } = useMutation({
    mutationFn: async () => {
      const { currentAccount, convoIsUnread, newReadUntil } = getToggleReadStatusData({ topic });

      if (convoIsUnread) {
        await markTopicAsRead({
          account: currentAccount,
          topic,
          readUntil: newReadUntil,
        });
      } else {
        await markTopicAsUnread({
          account: currentAccount,
          topic,
          readUntil: newReadUntil,
        });
      }
    },
    onMutate: () => {
      const currentAccount = getCurrentAccount()!;
      const previousData = getConversationDataQueryData({
        account: currentAccount,
        topic,
        context: "useToggleReadStatus",
      });

      const { currentAccount: account, newReadUntil } = getToggleReadStatusData({ topic });

      setConversationDataQueryData({
        account,
        topic,
        context: "useToggleReadStatus",
        data: { readUntil: newReadUntil },
      });

      return { previousData };
    },
    // ... onError remains the same ...
  });

  return { toggleReadStatusAsync };
};
```

Changes made:
1. Created a new helper function `getToggleReadStatusData` that centralizes the common logic
2. The helper returns all the necessary data: `currentAccount`, `lastMessageTime`, `convoIsUnread`, and `newReadUntil`
3. Updated both `mutationFn` and `onMutate` to use this helper function
4. Removed duplicate code for calculating timestamps and read status

This makes the code more maintainable and reduces the chance of inconsistencies between the mutation and optimistic update logic.

---



---

