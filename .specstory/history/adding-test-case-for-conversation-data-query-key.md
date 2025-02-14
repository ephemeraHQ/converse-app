## SpecStory

## Adding Test Case for Conversation Data Query Key (1/14/2025, 8:06:09 PM)

_**User**_

add CONVERSATION_DATA for test check @QueryKeys.ts 

---

_**Assistant**_

I'll add the test case for `conversationDataQueryKey` in the test file. Here's the addition needed:

```typescript:queries/QueryKeys.test.ts
// ... existing code ...

  // Conversations
  it("conversationsQueryKey should return correct array", () => {
    expect(conversationsQueryKey(account)).toEqual([
      QueryKeys.CONVERSATIONS,
      account.toLowerCase(),
    ]);
  });

  it("conversationDataQueryKey should return correct array", () => {
    expect(conversationDataQueryKey(account, topic)).toEqual([
      QueryKeys.CONVERSATION_DATA,
      account.toLowerCase(),
      topic,
    ]);
  });

  it("conversationQueryKey should return correct array", () => {
// ... existing code ...
```

This adds a test case for the `conversationDataQueryKey` function, following the same pattern as the other conversation-related query key tests. The test verifies that the function returns an array with the correct QueryKey enum value, lowercased account, and topic.

Make sure to also import `conversationDataQueryKey` at the top of the file if it's not already there:

```typescript:queries/QueryKeys.test.ts
import {
  QueryKeys,
  conversationsQueryKey,
  conversationQueryKey,
  conversationDataQueryKey, // Add this import
  // ... rest of imports ...
} from "./QueryKeys";
```

---



---

