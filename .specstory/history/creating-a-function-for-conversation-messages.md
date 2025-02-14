## SpecStory

## Creating a Function for Conversation Messages (2/5/2025, 2:14:57 PM)

_**User**_

is there a function that does this erer "setConversationMessagesQueryData"

---

_**Assistant**_

No, there isn't a `setConversationMessagesQueryData` function in this file. However, looking at the patterns in the code, you might want to create one to maintain consistency with the other query-related functions. Here's how you could add it:

```typescript:queries/conversation-messages-query.ts
// ... existing code ...

export function setConversationMessagesQueryData(args: {
  account: string;
  topic: ConversationTopic;
  data: IMessageAccumulator;
}) {
  const { account, topic, data } = args;
  return queryClient.setQueryData(
    getConversationMessagesQueryOptions({ account, topic }).queryKey,
    data
  );
}

// ... existing code ...
```

This function follows the same pattern as other query-related functions in the file and would allow you to directly set the messages data for a conversation. It uses the same query key generation and data structure as the rest of the conversation messages functionality.

You could use it like this:
```typescript
setConversationMessagesQueryData({
  account: "someAccount",
  topic: "someTopic",
  data: {
    ids: [],
    byId: {},
    reactions: {}
  }
});
```

---



---

