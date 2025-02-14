## SpecStory

## Implementing markedAsRead Property in Conversations (1/14/2025, 10:02:03 AM)

_**User**_

ok there's now a "markedAsRead" property that I've added so if we markConvoasRead don't forget to put "markedAsRead: true" and if we mark as unread put "markedAsRead: false" don't forget onMutate and onError

---

_**Assistant**_

I'll help you update the code to include the `markedAsRead` property in both the mutation function and the optimistic updates. Here are the necessary changes:

```typescript:features/conversation-list/hooks/use-toggle-read-status.ts
// ... existing imports ...

export const useToggleReadStatus = ({ topic }: UseToggleReadStatusProps) => {
  const { mutateAsync: toggleReadStatusAsync } = useMutation({
    mutationFn: async () => {
      const currentAccount = getCurrentAccount();
      const [conversationData, conversation] = await Promise.all([
        // ... existing Promise.all code ...
      ]);

      const convoIsUnread = conversationIsUnread({
        lastMessageSent: conversation?.lastMessage?.sentNs ?? 0,
        readUntil: conversationData?.readUntil ?? 0,
      });

      if (convoIsUnread) {
        await markTopicAsRead({
          account: currentAccount!,
          topic,
          readUntil: new Date().getTime(),
        });
      } else {
        await markTopicAsUnread({
          account: currentAccount!,
          topic,
        });
      }
    },
    onMutate: () => {
      const currentAccount = getCurrentAccount();
      const previousData = getConversationDataQueryData({
        account: currentAccount!,
        topic,
        context: "useToggleReadStatus",
      });

      const convoIsUnread = conversationIsUnread({
        lastMessageSent: getConversationQueryData({
          account: currentAccount!,
          topic,
          context: "useToggleReadStatus",
        })?.lastMessage?.sentNs ?? 0,
        readUntil: previousData?.readUntil ?? 0,
      });

      setConversationDataQueryData({
        account: currentAccount!,
        topic,
        context: "useToggleReadStatus",
        data: {
          readUntil: convoIsUnread ? new Date().getTime() : 0,
          markedAsRead: convoIsUnread,
        },
      });

      return { previousData };
    },
    onError: (error, _, context) => {
      const currentAccount = getCurrentAccount();
      setConversationDataQueryData({
        account: currentAccount!,
        topic,
        context: "useToggleReadStatus",
        data: context?.previousData,
      });
    },
  });

  return { toggleReadStatusAsync };
};
```

Key changes made:
1. In `onMutate`, we now:
   - Store the entire previous data object instead of just `readUntil`
   - Calculate `convoIsUnread` to determine the new `markedAsRead` value
   - Set both `readUntil` and `markedAsRead` in the optimistic update
2. In `onError`, we now restore the entire previous data object instead of just `readUntil`

Note that we're setting `markedAsRead: true` when marking as read (when `convoIsUnread` is true) and `markedAsRead: false` when marking as unread.

---



---

