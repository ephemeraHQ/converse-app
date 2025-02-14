## SpecStory

## Fixing Optimistic Message Duplication (12/16/2024, 10:31:18 AM)

_**User**_

I have a problem with my optimistc messages logic, so I see messages in double. Because I add the optimisitc but then even if I delete optimstici message after finding the real one, it's sstill stays in the result I feel

---

_**Assistant**_

I see the issue. The problem is in the order of operations when handling optimistic messages. You're removing the optimistic message but then immediately adding the real message, which can lead to duplicates. Here's how we can fix this part of the code:

```typescript:queries/useConversationMessages.ts
for (const message of validMessages) {
  // We handle reactions after
  if (!isReactionMessage(message)) {
    const messageId = message.id as MessageId;

    // Find matching optimistic message using correlationId from message root
    const optimisticMessage = optimisticMessages.find(
      (msg) => msg.messageId === message.id
    );

    // If we have an optimistic message, we're receiving the real one now
    if (optimisticMessage) {
      // Remove the optimistic version first
      removeOptimisticMessage(messageId);
      result.ids = result.ids.filter((id) => id !== optimisticMessage.tempId);
      delete result.byId[optimisticMessage.tempId as MessageId];
      
      // Replace the optimistic message with the real one at the same position
      const optimisticIndex = result.ids.indexOf(optimisticMessage.tempId);
      if (optimisticIndex !== -1) {
        result.ids[optimisticIndex] = messageId;
        result.byId[messageId] = message;
        continue; // Skip the normal message addition logic
      }
    }

    // Normal message addition logic (only for non-optimistic messages)
    if (!result.ids.includes(messageId)) {
      result.byId[messageId] = message;
      if (prependNewMessages) {
        result.ids = [messageId, ...result.ids];
      } else {
        result.ids.push(messageId);
      }
    }
  }
}
```

Key changes made:
1. When we find an optimistic message, we now try to replace it at the exact same position in the array
2. We use `continue` to skip the normal message addition logic when handling optimistic messages
3. We only add new messages if they don't already exist in our `ids` array

This should prevent the duplicate messages issue while maintaining the correct order of messages in your conversation.

---



---

