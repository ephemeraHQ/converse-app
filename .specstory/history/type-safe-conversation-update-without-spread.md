## SpecStory

## Type-Safe Conversation Update Without Spread (12/18/2024, 10:37:39 AM)

_**User**_

how can i not update with spread? 

---

_**Assistant**_

I'll help you modify the `updateConversationInConversationListQuery` function to avoid using spread operators when updating the conversation. Here's the safer approach:

```typescript:queries/useConversationListQuery.ts
// ... existing code ...

export const updateConversationInConversationListQuery = (args: {
  account: string;
  topic: ConversationTopic;
  conversation: Partial<ConversationWithCodecsType>;
}) => {
  logger.debug(
    `[updateConversationInConversationListQuery] Updating conversation in conversation list query`,
    {
      topic: args.topic,
    }
  );
  const { account, topic, conversation } = args;
  const previousConversationsData = getConversationListQueryData({ account });
  if (!previousConversationsData) {
    return;
  }

  const newConversations = previousConversationsData.map((c) => {
    if (c.topic === topic) {
      // Only update the specific fields that are provided in the conversation parameter
      Object.keys(conversation).forEach((key) => {
        if (conversation[key as keyof typeof conversation] !== undefined) {
          c[key as keyof typeof c] = conversation[key as keyof typeof conversation] as any;
        }
      });
      return c;
    }
    return c;
  });

  setConversationListQueryData({ account, conversations: newConversations });
};

// ... existing code ...
```

This change:
1. Removes the spread operators that could potentially overwrite unexpected properties
2. Explicitly updates only the fields that are provided in the `conversation` parameter
3. Maintains the original object reference for properties that aren't being updated
4. Is more type-safe as it only updates existing properties

Note: The `as any` cast is used here because TypeScript has limitations with dynamic key access in this scenario. If you want to make it even more type-safe, you could create a type utility to validate the keys, but this would add more complexity.

---



---

