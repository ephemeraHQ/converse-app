## SpecStory

## Request for Replacement (1/16/2025, 12:05:50 PM)

_**User**_

replace with something like this :

---

_**Assistant**_



---

_****_

I'll help you replace the mutation logic with something similar to what's used in `useConversationQuery.ts`. Here's the updated code:

```typescript:queries/conversations-query.ts
// ... existing code ...

  const newConversations = previousConversationsData.map((c) => {
    if (c.topic === topic) {
      // Create new object while preserving prototype chain and methods
      const updatedConversation = Object.create(
        Object.getPrototypeOf(c),
        Object.getOwnPropertyDescriptors(c)
      );
      // Apply updates to the new object
      return Object.assign(updatedConversation, conversationUpdate);
    }
    return c;
  });

// ... existing code ...
```

This change replaces the `mutateObjectProperties` utility with a more robust approach that:
1. Creates a new object while preserving the prototype chain and methods
2. Copies all property descriptors from the original conversation
3. Safely applies the updates to the new object

This matches the pattern used in `useConversationQuery.ts` and should prevent any issues with methods becoming undefined.

---



---

