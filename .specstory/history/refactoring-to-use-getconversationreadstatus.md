## SpecStory

## Refactoring to Use getConversationReadStatus (1/14/2025, 10:10:36 AM)

_**User**_

can we use "getConversationReadStatus"

---

_**Assistant**_

Yes, we can refactor this code to use the existing `getConversationReadStatus` function since it performs the same check. This will reduce code duplication. Here's how to update the code:

```typescript:features/conversation-list/hooks/use-toggle-read-status.ts
// ... existing code ...

export const useToggleReadStatus = ({ topic }: UseToggleReadStatusProps) => {
  const { mutateAsync: toggleReadStatusAsync } = useMutation({
    mutationFn: async () => {
      const currentAccount = getCurrentAccount()!;
      await getOrFetchConversationData({
        account: currentAccount,
        topic,
        context: "useToggleReadStatus",
      });

      const convoIsUnread = getConversationReadStatus({ topic });

      if (convoIsUnread) {
        await markTopicAsRead({
          account: currentAccount,
          topic,
          readUntil: new Date().getTime(),
        });
      } else {
        await markTopicAsUnread({
          account: currentAccount,
          topic,
        });
      }
    },
    // ... rest of the mutation config remains the same ...
  });

  return { toggleReadStatusAsync };
};
```

The changes:
1. Replaced the `Promise.all` and manual unread check with a call to `getConversationReadStatus`
2. We still need to call `getOrFetchConversationData` to ensure we have the latest data, but we don't need to store its result
3. Removed the redundant conversation query since `getConversationReadStatus` will handle that

This makes the code more DRY and consistent with the rest of the file.

---



---

