## SpecStory

## Optimizing Conversation Re-renders (1/13/2025, 10:29:10 AM)

_**User**_

the problem here is that when the conversation is updated it will retrigger a rerender no? What I want is only rerender if the unread status has changed

---

_**Assistant**_

You're right - the current implementation will cause a re-render whenever the conversation object changes, even if the unread status remains the same. Let's modify the hook to only trigger re-renders when the actual unread status changes.

Here's how we can optimize it:

```typescript:features/conversation-list/hooks/useConversationIsUnread.ts
// ... existing imports ...

export const useConversationIsUnread = ({
  topic,
}: UseConversationIsUnreadArgs) => {
  const conversation = useConversationByTopic(topic);

  const { conversationTopicsData } = useChatStore(
    useSelect(["conversationTopicsData"])
  );

  return useMemo(() => {
    const isUnread = () => {
      const currentInboxId = getCurrentUserAccountInboxId();

      // No message means no unread status
      if (!conversation?.lastMessage) return false;
      if (!conversationTopicsData[topic]) return false;

      // Check if status is unread
      if (conversationTopicsData[topic]?.status === "unread") return true;

      // Check if the last message was sent by the current user
      if (conversation?.lastMessage?.senderInboxId === currentInboxId) {
        return false;
      }

      const timestamp = normalizeTimestampToMs(conversation?.lastMessage?.sentNs);
      const readUntil = conversationTopicsData[topic]?.readUntil || 0;

      // Return true if the last message timestamp is greater than readUntil
      return readUntil < (timestamp ?? 0);
    };

    // Only return the boolean result
    return isUnread();
  }, [
    // Only depend on the specific values we need, not the entire objects
    topic,
    conversation?.lastMessage?.senderInboxId,
    conversation?.lastMessage?.sentNs,
    conversationTopicsData[topic]?.status,
    conversationTopicsData[topic]?.readUntil,
  ]);
};
```

Key changes:
1. Moved the logic into an inner function for clarity
2. Modified the dependency array to only include the specific values we care about instead of the entire `conversation` and `conversationTopicsData` objects
3. This ensures the memo will only recompute when the values that actually affect the unread status change

Now the hook will only trigger re-renders when one of these specific values changes:
- The topic
- The sender of the last message
- The timestamp of the last message
- The conversation's status
- The readUntil timestamp

---

_**User**_

but still if I use this hook, if conversation update because of "useConversationByTopic" it will still cause a render from the caller no?

---

_**Assistant**_

Ah, I see your point! Yes, you're correct. Even though our `useMemo` is optimized, the hook itself will still re-render when `useConversationByTopic` returns a new conversation object, which could then cause the parent component to re-render.

Let's fix this by using `useConversationByTopic` inside the `useMemo` to prevent unnecessary re-renders of the parent:

```typescript:features/conversation-list/hooks/useConversationIsUnread.ts
// ... existing imports ...

export const useConversationIsUnread = ({
  topic,
}: UseConversationIsUnreadArgs) => {
  const { conversationTopicsData } = useChatStore(
    useSelect(["conversationTopicsData"])
  );

  return useMemo(() => {
    const conversation = useConversationByTopic(topic);
    const currentInboxId = getCurrentUserAccountInboxId();

    // No message means no unread status
    if (!conversation?.lastMessage) return false;
    if (!conversationTopicsData[topic]) return false;

    // Check if status is unread
    if (conversationTopicsData[topic]?.status === "unread") return true;

    // Check if the last message was sent by the current user
    if (conversation?.lastMessage?.senderInboxId === currentInboxId) {
      return false;
    }

    const timestamp = normalizeTimestampToMs(conversation?.lastMessage?.sentNs);
    const readUntil = conversationTopicsData[topic]?.readUntil || 0;

    // Return true if the last message timestamp is greater than readUntil
    return readUntil < (timestamp ?? 0);
  }, [
    topic,
    conversationTopicsData[topic]?.status,
    conversationTopicsData[topic]?.readUntil,
  ]);
};
```

However, there's a potential issue here: moving `useConversationByTopic` inside `useMemo` might violate the Rules of Hooks since hooks should be called at the top level. A better approach might be to create a new hook in the XMTP SDK that only returns the specific data we need (lastMessage, senderInboxId, sentNs) rather than the entire conversation object.

Would you like me to suggest how to create such a specialized hook instead?

---



---

