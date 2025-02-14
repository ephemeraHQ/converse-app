## SpecStory

## Handling Message Duplication in Conversations (12/11/2024, 3:39:07 PM)

_**User**_

It can happen that this method is called to add a new message, but the new message "already exists" in the data because we added it using optimistic update. but it has a random ID. so the problem with our current code is that the same message will probably get added twice, what could i do to make sure that we don't do that and that the new message replace the optimisitc one?

---

_**Assistant**_

I understand the issue. We need to check if a message with the same content already exists and replace it instead of adding a duplicate. We can compare messages using their content rather than IDs since optimistic messages will have different IDs. Here's how we can modify the code:

```typescript:queries/useConversationMessages.ts
// ... existing code ...

function processMessages(args: {
  messages: DecodedMessageWithCodecsType[];
  existingData?: IMessageAccumulator;
  prependNewMessages?: boolean;
}): IMessageAccumulator {
  const { messages, existingData, prependNewMessages = false } = args;

  const result: IMessageAccumulator = existingData
    ? { ...existingData }
    : {
        ids: [],
        byId: {},
        reactions: {},
      };

  const validMessages = messages.filter(
    (message) =>
      !ignoredContentTypesPrefixes.some((prefix) =>
        message.contentTypeId.startsWith(prefix)
      )
  );

  // First process regular messages
  for (const message of validMessages) {
    if (!isReactionMessage(message)) {
      const messageId = message.id as MessageId;
      const messageContent = message.content();
      
      // Find existing message with same content (optimistic message)
      const existingMessageId = result.ids.find(id => {
        const existingMessage = result.byId[id];
        return existingMessage.content() === messageContent;
      });

      // If found, remove the optimistic message
      if (existingMessageId) {
        result.ids = result.ids.filter(id => id !== existingMessageId);
        delete result.byId[existingMessageId];
      }

      // Add the new message
      result.byId[messageId] = message;
      if (prependNewMessages) {
        result.ids = [messageId, ...result.ids];
      } else if (!result.ids.includes(messageId)) {
        result.ids.push(messageId);
      }
    }
  }

// ... existing code ...
```

The changes:
1. We now look for an existing message with the same content before adding a new one
2. If we find a message with matching content (likely the optimistic version), we remove it from both `ids` and `byId`
3. Then we add the new message with the real ID

This way, when the real message comes in to replace an optimistic message, we'll avoid duplicates while maintaining the correct order in the conversation.

---

_**User**_

But many message can have the same content no? The optimistic message will have "ID" "new-message-id"

---

_**Assistant**_

Ah yes, you're right! If we know the optimistic message has a specific ID ("new-message-id"), we can use that to make the replacement more precise. Here's the corrected version:

```typescript:queries/useConversationMessages.ts
// ... existing code ...

  // First process regular messages
  for (const message of validMessages) {
    if (!isReactionMessage(message)) {
      const messageId = message.id as MessageId;
      
      // Check if there's an optimistic message to replace
      const hasOptimisticMessage = result.ids.includes("new-message-id");
      if (hasOptimisticMessage) {
        result.ids = result.ids.filter(id => id !== "new-message-id");
        delete result.byId["new-message-id"];
      }

      // Add the new message
      result.byId[messageId] = message;
      if (prependNewMessages) {
        result.ids = [messageId, ...result.ids];
      } else if (!result.ids.includes(messageId)) {
        result.ids.push(messageId);
      }
    }
  }

// ... existing code ...
```

This is much more reliable since we're specifically looking for the optimistic message ID "new-message-id" rather than trying to match content. When the real message comes in, it will replace the optimistic one if it exists.

---

_**User**_

But still, how do i know that this new received message is the replacement for this one?

---

_**Assistant**_



Ah, now I understand the core issue better. We need a way to link the optimistic message with its real counterpart. One common approach is to add a temporary ID or correlation ID when creating the optimistic message. Then, when the real message arrives, we can match them using some unique identifier from the message content.

Here's how we could modify the code:

```typescript:queries/useConversationMessages.ts
type IOptimisticMessage = {
  tempId: string;
  // Some unique identifier from your message content
  // This could be a timestamp + content hash, or whatever unique data 
  // you include in both optimistic and real messages
  correlationId: string;
}

// Keep track of optimistic messages
const optimisticMessages: IOptimisticMessage[] = [];

// When creating optimistic update:
export const addConversationMessage = (
  account: string,
  topic: ConversationTopic,
  message: DecodedMessageWithCodecsType,
  isOptimistic?: boolean
) => {
  if (isOptimistic) {
    // Add to tracking array
    optimisticMessages.push({
      tempId: "new-message-id",
      correlationId: message.content().correlationId // You'll need to add this to your message content
    });
  }

  queryClient.setQueryData<ConversationMessagesQueryData>(
    conversationMessagesQueryKey(account, topic),
    (previousMessages) => {
      return processMessages({
        messages: [message],
        existingData: previousMessages,
        prependNewMessages: true,
      });
    }
  );
};

// In processMessages:
function processMessages(args: {
  messages: DecodedMessageWithCodecsType[];
  existingData?: IMessageAccumulator;
  prependNewMessages?: boolean;
}): IMessageAccumulator {
  const { messages, existingData, prependNewMessages = false } = args;

  const result: IMessageAccumulator = existingData
    ? { ...existingData }
    : {
        ids: [],
        byId: {},
        reactions: {},
      };

  // First process regular messages
  for (const message of validMessages) {
    if (!isReactionMessage(message)) {
      const messageId = message.id as MessageId;
      const correlationId = message.content().correlationId;

      // Find matching optimistic message
      const optimisticMessage = optimisticMessages.find(
        msg => msg.correlationId === correlationId
      );

      if (optimisticMessage) {
        // Remove the optimistic message from tracking and from the result
        optimisticMessages = optimisticMessages.filter(
          msg => msg.correlationId !== correlationId
        );
        result.ids = result.ids.filter(id => id !== optimisticMessage.tempId);
        delete result.byId[optimisticMessage.tempId];
      }

      // Add the new message
      result.byId[messageId] = message;
      if (prependNewMessages) {
        result.ids = [messageId, ...result.ids];
      } else if (!result.ids.includes(messageId)) {
        result.ids.push(messageId);
      }
    }
  }

  return result;
}
```

The key points:
1. You need some way to correlate the optimistic message with its real counterpart. This could be:
   - A timestamp + content hash
   - A UUID you generate and include in the message content
   - Any unique identifier that will be the same in both the optimistic and real message
2. When creating the optimistic message, track it with both its temporary ID and correlation ID
3. When processing new messages, check if any match our tracked optimistic messages
4. If found, remove the optimistic version and add the real one

Would you like me to help you figure out what correlation ID would work best for your specific message structure?

---

_**User**_

correclationId can be added at message root no in content()

---

_**Assistant**_



Ah yes, you're right! We can add the correlation ID at the message root level. Here's the corrected version:

```typescript:queries/useConversationMessages.ts
type IOptimisticMessage = {
  tempId: string;
  correlationId: string;
}

// Keep track of optimistic messages
const optimisticMessages: IOptimisticMessage[] = [];

export const addConversationMessage = (
  account: string,
  topic: ConversationTopic,
  message: DecodedMessageWithCodecsType,
  isOptimistic?: boolean
) => {
  if (isOptimistic) {
    optimisticMessages.push({
      tempId: "new-message-id",
      correlationId: message.correlationId
    });
  }

  queryClient.setQueryData<ConversationMessagesQueryData>(
    conversationMessagesQueryKey(account, topic),
    (previousMessages) => {
      return processMessages({
        messages: [message],
        existingData: previousMessages,
        prependNewMessages: true,
      });
    }
  );
};

function processMessages(args: {
  messages: DecodedMessageWithCodecsType[];
  existingData?: IMessageAccumulator;
  prependNewMessages?: boolean;
}): IMessageAccumulator {
  const { messages, existingData, prependNewMessages = false } = args;

  const result: IMessageAccumulator = existingData
    ? { ...existingData }
    : {
        ids: [],
        byId: {},
        reactions: {},
      };

  for (const message of validMessages) {
    if (!isReactionMessage(message)) {
      const messageId = message.id as MessageId;

      // Find matching optimistic message using correlationId from message root
      const optimisticMessage = optimisticMessages.find(
        msg => msg.correlationId === message.correlationId
      );

      if (optimisticMessage) {
        // Remove the optimistic message from tracking and from the result
        optimisticMessages = optimisticMessages.filter(
          msg => msg.correlationId !== message.correlationId
        );
        result.ids = result.ids.filter(id => id !== optimisticMessage.tempId);
        delete result.byId[optimisticMessage.tempId];
      }

      // Add the new message
      result.byId[messageId] = message;
      if (prependNewMessages) {
        result.ids = [messageId, ...result.ids];
      } else if (!result.ids.includes(messageId)) {
        result.ids.push(messageId);
      }
    }
  }

  return result;
}
```

The main change is that we now access `correlationId` directly from the message object instead of from its content. This makes more sense as it's a metadata property rather than part of the message content itself.

---

_**User**_

For the code present, we get this error:
```
Cannot assign to 'optimisticMessages' because it is a constant.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

Since `optimisticMessages` is declared as a `const`, we need to make it mutable. Change its declaration to:

```typescript:queries/useConversationMessages.ts
// Keep track of optimistic messages
let optimisticMessages: IOptimisticMessage[] = [];
```

This will allow us to reassign the array when filtering out messages.

---

_**User**_

For the code present, we get this error:
```
Property 'correlationId' does not exist on type 'DecodedMessage<TextCodec, SupportedCodecsType> | DecodedMessage<ReactionCodec, SupportedCodecsType> | ... 6 more ... | DecodedMessage<...>'.
  Property 'correlationId' does not exist on type 'DecodedMessage<TextCodec, SupportedCodecsType>'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_



We need to add `correlationId` to the message type. Add this type extension at the top of the file:

```typescript:queries/useConversationMessages.ts
declare module '@xmtp/react-native-sdk' {
  interface DecodedMessage {
    correlationId?: string;
  }
}
```

This extends the base `DecodedMessage` type to include the optional `correlationId` property.

---

_**User**_

can we instead of adding "correlationId" to message, we keep the optimistic messages array but we just add in that array when we're adding an optimitic message, and then we just compare the message id with ones . What will be the "correlationId" exactly?

---

_**Assistant**_



Ah, I understand - we can use the message ID itself as the correlation ID. When we create an optimistic message, we'll know its future ID. Here's the simplified approach:

```typescript:queries/useConversationMessages.ts
type IOptimisticMessage = {
  tempId: string;
  realMessageId: string;  // The ID that the real message will have
}

let optimisticMessages: IOptimisticMessage[] = [];

// In processMessages:
      const messageId = message.id as MessageId;
      
      // Find matching optimistic message using the real message ID
      const optimisticMessage = optimisticMessages.find(
        msg => msg.realMessageId === messageId
      );

      if (optimisticMessage) {
        // Remove the optimistic message
        optimisticMessages = optimisticMessages.filter(
          msg => msg.realMessageId !== messageId
        );
        result.ids = result.ids.filter(id => id !== optimisticMessage.tempId);
        delete result.byId[optimisticMessage.tempId];
      }
```

When adding an optimistic message, you'll need to know what ID the real message will have and include it in the `optimisticMessages` array.

---

_**User**_

But i ddon't know the realMessageId... 

---

_**Assistant**_



Ah, you're right - we can't know the real message ID in advance. Let's think about what unique identifier we do have...

In a messaging system, we typically have something unique about the message itself that we can use to match the optimistic version with the real one, such as:
- A timestamp + sender combination
- The message content + sender
- A UUID you generate when sending the message

Could you share how your messages are created/sent? That would help identify what unique data we could use to match the optimistic message with its real counterpart.

---

_**User**_

A UUID you generate when sending the message wont work no? because we need to find a way to match the new messsage from the server and our optimistic one

---

_**Assistant**_



You're right - if we generate a UUID locally, the server wouldn't know about it. We need something that will be consistent between our optimistic message and the server's response.

What happens when you send a message? Is there some kind of request ID or transaction ID that gets returned by the server and is then included in the message when it comes back through the websocket/stream? 

This would help us understand what identifier we could use to match the optimistic message with the real one. Could you share the message sending flow or the structure of the message object when it comes back from the server?

---

_**User**_

Yes! you're right I receive the messageId from the server, so we can use this? The only thing is that it won't be FULLY optimistic update because I'll be waiting from the server to receive the messageId... 

---

_**Assistant**_



Ah yes, this is a common pattern! It's called "optimistic UI with server acknowledgment". While not fully optimistic, it's still better UX than waiting for the full message to arrive. Here's how we could implement it:

```typescript:queries/useConversationMessages.ts
type IOptimisticMessage = {
  tempId: string;
  serverMessageId: string;  // The ID we get from server acknowledgment
}

let optimisticMessages: IOptimisticMessage[] = [];

// When sending a message:
export const addConversationMessage = async (
  account: string,
  topic: ConversationTopic,
  message: DecodedMessageWithCodecsType,
  serverMessageId?: string  // Received from server ack
) => {
  if (serverMessageId) {
    optimisticMessages.push({
      tempId: "new-message-id",
      serverMessageId
    });
  }

  queryClient.setQueryData<ConversationMessagesQueryData>(
    conversationMessagesQueryKey(account, topic),
    (previousMessages) => {
      return processMessages({
        messages: [message],
        existingData: previousMessages,
        prependNewMessages: true,
      });
    }
  );
};
```

This way:
1. Show optimistic UI immediately with a temp ID
2. When server acknowledges, update the `optimisticMessages` with the real ID
3. When the full message arrives, match and replace using that ID

Would this work better with your flow?

---



---

