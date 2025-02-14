## SpecStory

## Optimizing Conversation Read Status Logic (1/13/2025, 10:32:42 AM)

_**User**_

can we put the logic of checking if the conversation was read here?

---

_**Assistant**_

I'll help modify the `select` function to include the unread status logic. This will help optimize the code by moving the logic earlier in the data pipeline.

Here's the modified code:

```typescript:features/conversation-list/hooks/useConversationIsUnread.ts
// ... existing imports ...

export const useConversationIsUnread = ({
  topic,
}: UseConversationIsUnreadArgs) => {
  const currentAccount = useCurrentAccount();
  const { conversationTopicsData } = useChatStore(
    useSelect(["conversationTopicsData"])
  );

  const {data: isUnread} = useQuery({
    ...getConversationQueryOptions({
      account: currentAccount!,
      topic,
    }),
    select: (data) => {
      const currentInboxId = getCurrentUserAccountInboxId();
      const lastMessage = data?.lastMessage;
      const topicData = conversationTopicsData[topic];

      // No message or no topic data means not unread
      if (!lastMessage || !topicData) return false;

      // Check if status is explicitly marked as unread
      if (topicData.status === "unread") return true;

      // Messages from current user are never unread
      if (lastMessage.senderInboxId === currentInboxId) return false;

      const timestamp = normalizeTimestampToMs(lastMessage.sentNs);
      const readUntil = topicData.readUntil || 0;

      return readUntil < (timestamp ?? 0);
    },
  });

  return isUnread ?? false;
};
```

Key changes made:
1. Moved all the unread logic into the `select` function
2. Renamed the query result from `conversation` to `isUnread` to better reflect its purpose
3. Removed the `useMemo` since the logic is now handled in the query's select
4. Removed the unused `useConversationByTopic` import and call
5. Added a fallback `?? false` to ensure we always return a boolean

This change makes the code more efficient by:
- Computing the unread status as part of the query transformation
- Reducing the number of state dependencies that could trigger re-renders
- Simplifying the component's logic

---

_**User**_

but what happens if "conversationTopicsData" triggers a rerender, will the useQuery and the select render again?

---

_**Assistant**_

Yes, you make a good point. The `select` function will re-run whenever `conversationTopicsData` changes because it's being used inside the `select` function, but the query itself won't refetch. This isn't ideal for performance.

Let's keep the `useMemo` and move the logic back out. Here's the correct approach:

```typescript:features/conversation-list/hooks/useConversationIsUnread.ts
export const useConversationIsUnread = ({
  topic,
}: UseConversationIsUnreadArgs) => {
  const currentAccount = useCurrentAccount();
  const { conversationTopicsData } = useChatStore(
    useSelect(["conversationTopicsData"])
  );

  const {data: lastMessage} = useQuery({
    ...getConversationQueryOptions({
      account: currentAccount!,
      topic,
    }),
    select: (data) => data?.lastMessage,
  });

  return useMemo(() => {
    const currentInboxId = getCurrentUserAccountInboxId();
    const topicData = conversationTopicsData[topic];

    // No message or no topic data means not unread
    if (!lastMessage || !topicData) return false;

    // Check if status is explicitly marked as unread
    if (topicData.status === "unread") return true;

    // Messages from current user are never unread
    if (lastMessage.senderInboxId === currentInboxId) return false;

    const timestamp = normalizeTimestampToMs(lastMessage.sentNs);
    const readUntil = topicData.readUntil || 0;

    return readUntil < (timestamp ?? 0);
  }, [conversationTopicsData, topic, lastMessage]);
};
```

This is better because:
1. The query's `select` function remains simple and stable
2. The `useMemo` properly handles recomputation when either the query data or the conversation topics data changes
3. We avoid unnecessary select function re-runs when `conversationTopicsData` changes

---



---

