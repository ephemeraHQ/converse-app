## SpecStory

## Prepend New Messages in List (1/17/2025, 8:37:09 AM)

_**User**_

make sure new message are always added at the beginning of list or object for "ids" and "byId"

---

_**Assistant**_

I'll modify the code to ensure new messages are always added at the beginning of the list. We need to update the `processMessages` function to consistently prepend new messages.

```typescript:queries/use-conversation-messages-query.ts
// ... existing code ...

function processMessages(args: {
  messages: DecodedMessageWithCodecsType[];
  existingData?: IMessageAccumulator;
  prependNewMessages?: boolean;
}): IMessageAccumulator {
  const { messages, existingData } = args;

  const result: IMessageAccumulator = existingData
    ? { ...existingData }
    : {
        ids: [],
        byId: {},
        reactions: {},
      };

  // For now, we ignore messages with these content types
  const validMessages = messages.filter(
    (message) =>
      !ignoredContentTypesPrefixes.some((prefix) =>
        message.contentTypeId.startsWith(prefix)
      )
  );

  // First process regular messages
  for (const message of validMessages) {
    // We handle reactions after
    if (!isReactionMessage(message)) {
      const messageId = message.id as MessageId;
      
      // Always prepend new messages to ids array and add to beginning of byId
      result.ids = [messageId, ...result.ids];
      result.byId = {
        [messageId]: message,
        ...result.byId,
      };
    }
  }

  // ... existing code for reactions processing ...
}

// ... existing code ...
```

The key changes made:
1. Removed the `prependNewMessages` parameter since we'll always prepend new messages
2. Modified how we add new messages to always prepend to `ids` array using spread operator
3. Modified how we add new messages to `byId` object to maintain order by placing new messages first

This ensures that new messages will consistently appear at the beginning of the list, maintaining chronological order with newest messages first.

---



---

