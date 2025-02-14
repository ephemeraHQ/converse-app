## SpecStory

## Ignoring Specific Message Content Types (12/11/2024, 2:53:44 PM)

_**User**_

I want that if the message is in the ignoredContentTTypes, we ignore the message

---

_**Assistant**_

I'll help you modify the `processMessages` function to ignore messages with content types that are in `ignoredContentTypes`. Here's how we can update the code:

```typescript:queries/useConversationMessages.ts
function processMessages(args: {
  messages: DecodedMessageWithCodecsType[];
  existingData?: IMessageAccumulator;
  prependNewMessages?: boolean;
  ignoredContentTypes?: string[];
}): IMessageAccumulator {
  const { 
    messages, 
    existingData, 
    prependNewMessages = false, 
    ignoredContentTypes = [] 
  } = args;

  const result: IMessageAccumulator = existingData
    ? { ...existingData }
    : {
        ids: [],
        byId: {},
        reactions: {},
      };

  // First process regular messages
  for (const message of messages) {
    // Skip messages with ignored content types
    if (ignoredContentTypes.includes(message.contentType)) {
      continue;
    }

    if (!isReactionMessage(message)) {
      const messageId = message.id as MessageId;
      result.byId[messageId] = message;
      if (prependNewMessages) {
        result.ids = [messageId, ...result.ids];
      } else if (!result.ids.includes(messageId)) {
        result.ids.push(messageId);
      }
    }
  }

  // ... rest of the code remains the same ...
```

Key changes made:
1. Added `ignoredContentTypes` as an optional parameter to the function arguments
2. Added a check to skip messages whose `contentType` is in the `ignoredContentTypes` array
3. Set a default empty array for `ignoredContentTypes` in the destructuring

Now when you call `processMessages`, you can optionally pass an array of content types to ignore:

```typescript
processMessages({
  messages,
  existingData,
  prependNewMessages: true,
  ignoredContentTypes: ['system/message', 'custom/ignored-type']
});
```

---



---

