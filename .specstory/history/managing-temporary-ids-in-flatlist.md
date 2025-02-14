## SpecStory

## Managing Temporary IDs in FlatList (1/17/2025, 8:26:18 AM)

_**User**_

Okay, so help me think this through. I know Key Extractors are used in FlatList to identify each item. So right now for example let's say I pass a list of message IDs. The problem that I have is let's say I create a new message. I create that message with a temporary ID. So and then a few seconds later when the full message load, I replace it but the problem is the message ID changed because I generated a temporary one and replaced it. But ideally I don't want to see any re-render of that item in my UI. How can I do that? 

---

_**Assistant**_

I understand the problem. When using temporary IDs that get replaced with permanent ones, the `keyExtractor` causes unnecessary re-renders because React sees them as different items when the ID changes. To solve this, you'll need a more stable identifier that remains consistent between the temporary and permanent states of a message.

Here's how we can modify the code:

```typescript:features/conversation/conversation-messages-list.tsx
// ... existing code ...

type IMessageWithStableId = {
  messageId: MessageId;
  // This will be the same for both temporary and permanent messages
  stableId: string;
};

type ConversationMessagesListProps = Omit<
  AnimatedProps<FlatListProps<IMessageWithStableId>>,
  "renderItem" | "data"
> & {
  messageIds: IMessageWithStableId[];
  renderMessage: (args: {
    messageId: MessageId;
    index: number;
  }) => ReactElement;
};

const keyExtractor = (message: IMessageWithStableId) => message.stableId;

// ... existing code ...
```

Here's how you would use it:

1. When creating a new message, generate a stable ID (e.g., using UUID) and keep it associated with the message throughout its lifecycle.
2. When the temporary message is replaced with the permanent one, maintain the same stable ID.

For example, in your message creation logic:

```typescript
function createMessage() {
  // Generate a stable ID that will remain the same for temp and permanent message
  const stableId = generateUUID();
  
  // Create temporary message
  const tempMessageId = `temp-${stableId}`;
  const tempMessage = {
    messageId: tempMessageId,
    stableId,
  };

  // Later when permanent message arrives
  const permanentMessage = {
    messageId: actualMessageIdFromServer,
    stableId, // Same stable ID as temporary message
  };
}
```

This way, React will see the temporary and permanent messages as the same item because they share the same `stableId`, preventing unnecessary re-renders when the `messageId` changes.

Also, remove the `console.log` from the `keyExtractor` as it's not needed and could spam the console in production.

---

_**User**_

other ways i can do this without creating a stableId?

---

_**Assistant**_

Yes, there are a couple of other approaches you could use:

1. Use message content + timestamp as the key (if messages are immutable):

```typescript:features/conversation/conversation-messages-list.tsx
// ... existing code ...

const keyExtractor = (messageId: MessageId) => {
  const message = getMessageById(messageId); // You'll need access to the message content
  return `${message.content}-${message.timestamp}`;
};
```

2. Use array index if your list order is stable (though this is generally not recommended):

```typescript:features/conversation/conversation-messages-list.tsx
// ... existing code ...

const keyExtractor = (_messageId: MessageId, index: number) => `message-${index}`;
```

3. Use a combination of sender + local timestamp if that combination would be unique:

```typescript:features/conversation/conversation-messages-list.tsx
// ... existing code ...

const keyExtractor = (messageId: MessageId) => {
  const message = getMessageById(messageId);
  return `${message.senderAddress}-${message.localCreatedAt}`;
};
```

However, I would still recommend the `stableId` approach as it's:
1. Most reliable
2. Doesn't depend on message content
3. Guarantees uniqueness
4. Doesn't require accessing message content just for key extraction
5. Won't cause issues if messages are reordered

The other approaches might work but could have edge cases where they fail to maintain stability between temporary and permanent messages.

---

_**User**_

problem with timestamp is when i send the message i generate a timestmap but it will be replaced by the real timestamp. 

Index doens't work great you're rright

---

_**Assistant**_



Ah yes, you're absolutely right about the timestamp issue - the local timestamp would be different from the server timestamp.

Another approach could be to use the conversation topic + content as a key, assuming the content doesn't change between temporary and permanent messages:

```typescript:features/conversation/conversation-messages-list.tsx
const keyExtractor = (messageId: MessageId) => {
  const message = getMessageById(messageId);
  return `${message.topic}-${message.content()}`;
};
```

But this also has potential issues:
1. If someone sends the same message content multiple times
2. Performance impact of accessing message content for every key
3. Could break with attachments or other non-text content

Looking at all these alternatives, I'm circling back to recommend the `stableId` approach as the most robust solution. It's a small addition to your data structure but solves the problem cleanly without edge cases. You could generate it when creating the temporary message and maintain it through the message lifecycle.

If you really want to avoid adding a `stableId`, you could potentially use the temporary ID itself as the permanent key - when you replace the message, keep the temporary ID as a reference:

```typescript:features/conversation/hooks/use-send-message.ts
// ... existing code ...
onMutate: (variables) => {
  if (variables.content.text && !variables.referencedMessageId) {
    const generatedMessageId = getRandomId();
    
    const textMessage: DecodedMessage<TextCodec> = {
      id: generatedMessageId as MessageId,
      tempId: generatedMessageId, // Store the temp ID
      // ... rest of the message properties
    };
    
    // ... rest of the code
  }
},
```

Then use it in your key extractor:

```typescript:features/conversation/conversation-messages-list.tsx
const keyExtractor = (messageId: MessageId) => {
  const message = getMessageById(messageId);
  return message.tempId || messageId; // Use temp ID if exists, otherwise use real ID
};
```

But this is essentially the same concept as a `stableId`, just implemented differently.

---

_**User**_

but we can have many message with same content

---

_**Assistant**_



You're absolutely right - using message content as a key would be problematic since multiple messages can have the same content.

After considering all options, I think we have two viable approaches:

1. The cleanest solution is still adding a `stableId` as discussed earlier.

2. Alternatively, we could use the temporary message ID as the permanent key for that message. Here's how we could implement this:

```typescript:features/conversation/hooks/use-send-message.ts
// ... existing code ...
onMutate: (variables) => {
  if (variables.content.text && !variables.referencedMessageId) {
    const tempMessageId = getRandomId();

    const textMessage: DecodedMessage<TextCodec> = {
      id: tempMessageId as MessageId,
      _originalTempId: tempMessageId, // Store the temp ID for key stability
      // ... rest of message properties
    };

    addConversationMessageQuery({
      account: currentAccount,
      topic: conversation.topic,
      message: textMessage,
    });

    return {
      tempMessageId,
    };
  }
},

onSuccess: async (messageId, _, context) => {
  if (context && messageId) {
    const message = await fetchConversationMessageQuery({
      account: getCurrentAccount()!,
      messageId,
    });

    if (!message) {
      throw new Error("Message not found");
    }

    // Add the original temp ID to the real message
    const messageWithTempId = {
      ...message,
      _originalTempId: context.tempMessageId,
    };

    replaceOptimisticMessageWithReal({
      tempId: context.tempMessageId,
      topic: conversation.topic,
      account: getCurrentAccount()!,
      message: messageWithTempId,
    });
  }
}
```

Then in your list:

```typescript:features/conversation/conversation-messages-list.tsx
const keyExtractor = (messageId: MessageId) => {
  const message = getMessageById(messageId);
  // Use the original temp ID if it exists, otherwise use the real message ID
  return message._originalTempId || messageId;
};
```

This approach achieves the same goal as adding a `stableId` but works within your existing message structure by preserving the temporary ID through the message lifecycle. The key will remain stable even when the message ID changes from temporary to permanent.

---



---

