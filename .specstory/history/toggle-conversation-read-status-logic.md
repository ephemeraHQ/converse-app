## SpecStory

## Toggle Conversation Read Status Logic (1/14/2025, 10:25:15 AM)

_**User**_

create 2 useMutation, one for markAsRead and on that will markAsUnread, then have a useCallback that will check if the convoIsUnread and call the right mutateAsync

---

_**Assistant**_

I'll help you split the mutation into two separate ones and create a useCallback to handle the logic. Here's how to modify the code:

```typescript:features/conversation-list/hooks/use-toggle-read-status.ts
// ... existing imports ...

export const useToggleReadStatus = ({ topic }: UseToggleReadStatusProps) => {
  const { mutateAsync: markAsReadAsync } = useMutation({
    mutationFn: async () => {
      const currentAccount = getCurrentAccount()!;
      await markTopicAsRead({
        account: currentAccount,
        topic,
        readUntil: new Date().getTime(),
      });
    },
    onMutate: () => {
      const currentAccount = getCurrentAccount()!;
      const previousData = getConversationDataQueryData({
        account: currentAccount,
        topic,
        context: "useToggleReadStatus",
      });

      setConversationDataQueryData({
        account: currentAccount,
        topic,
        context: "useToggleReadStatus",
        data: {
          readUntil: new Date().getTime(),
          markedAsRead: true,
        },
      });

      return { previousData };
    },
    onError: (error, _, context) => {
      const currentAccount = getCurrentAccount()!;
      setConversationDataQueryData({
        account: currentAccount,
        topic,
        context: "useToggleReadStatus",
        data: context?.previousData,
      });
    },
  });

  const { mutateAsync: markAsUnreadAsync } = useMutation({
    mutationFn: async () => {
      const currentAccount = getCurrentAccount()!;
      await markTopicAsUnread({
        account: currentAccount,
        topic,
      });
    },
    onMutate: () => {
      const currentAccount = getCurrentAccount()!;
      const previousData = getConversationDataQueryData({
        account: currentAccount,
        topic,
        context: "useToggleReadStatus",
      });

      setConversationDataQueryData({
        account: currentAccount,
        topic,
        context: "useToggleReadStatus",
        data: {
          markedAsRead: false,
        },
      });

      return { previousData };
    },
    onError: (error, _, context) => {
      const currentAccount = getCurrentAccount()!;
      setConversationDataQueryData({
        account: currentAccount,
        topic,
        context: "useToggleReadStatus",
        data: context?.previousData,
      });
    },
  });

  const toggleReadStatusAsync = useCallback(async () => {
    const convoIsUnread = getConversationReadStatus({ topic });
    if (convoIsUnread) {
      await markAsReadAsync();
    } else {
      await markAsUnreadAsync();
    }
  }, [markAsReadAsync, markAsUnreadAsync, topic]);

  return { toggleReadStatusAsync };
};
```

Key changes made:
1. Split the single mutation into two separate mutations: `markAsReadAsync` and `markAsUnreadAsync`
2. Each mutation now has its specific logic without the conditional checks
3. Created a `useCallback` that determines which mutation to call based on the conversation's read status
4. The public API remains the same, still returning `toggleReadStatusAsync`

The code is now more modular and each mutation handles its specific case, making it easier to maintain and debug.

---



---

