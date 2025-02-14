## SpecStory

## Linking Optimistic Messages to Real Updates (12/16/2024, 10:37:39 AM)

_**User**_

after linking the optimsitic to the real, we need to update the message in query data also

---

_**Assistant**_

I'll help you modify the `linkOptimisticMessageToReal` function to update the query data after linking the optimistic message to the real one. Here's how we can do it:

```typescript
export function linkOptimisticMessageToReal(args: {
  tempId: string;
  messageId: MessageId;
  account: string;
  topic: ConversationTopic;
  message: DecodedMessageWithCodecsType;
}) {
  const { tempId, messageId, account, topic, message } = args;

  logger.info(
    "[linkOptimisticMessageToReal] linking optimistic message to real",
    {
      tempId,
      messageId,
    }
  );

  // Update optimistic messages tracking
  const optimisticMessage = optimisticMessages.find(
    (msg) => msg.tempId === tempId
  );
  if (optimisticMessage) {
    optimisticMessage.messageId = messageId;
  }

  // Update query data
  queryClient.setQueryData<ConversationMessagesQueryData>(
    conversationMessagesQueryKey(account, topic),
    (previousMessages) => {
      if (!previousMessages) {
        return previousMessages;
      }

      const updatedMessages = {
        ...previousMessages,
        ids: previousMessages.ids.map((id) => 
          id === tempId ? messageId : id
        ),
        byId: {
          ...previousMessages.byId,
          [messageId]: message
        }
      };

      // Remove the temporary message
      delete updatedMessages.byId[tempId as MessageId];

      return updatedMessages;
    }
  );
}
```

Key changes made:

1. Changed the function to accept an object with all necessary parameters
2. Added parameters for `account`, `topic`, and the real `message`
3. Added query data update using `queryClient.setQueryData`
4. Updated the message IDs array by replacing the temporary ID with the real one
5. Added the real message to the `byId` map
6. Removed the temporary message from the `byId` map

Now when you call this function, you'll need to provide all the necessary parameters:

```typescript
linkOptimisticMessageToReal({
  tempId: "temp-123",
  messageId: "real-456",
  account: "user-account",
  topic: "conversation-topic",
  message: realMessage
});
```

This will ensure that both the optimistic messages tracking and the query cache are properly updated when linking an optimistic message to its real counterpart.

---

_**User**_

Maybe we reuse the processMessages function?

---

_**Assistant**_

Yes, that's a better approach! We can reuse the `processMessages` function to maintain consistency in how messages are processed. Here's the updated version:

```typescript
export function linkOptimisticMessageToReal(args: {
  tempId: string;
  messageId: MessageId;
  account: string;
  topic: ConversationTopic;
  message: DecodedMessageWithCodecsType;
}) {
  const { tempId, messageId, account, topic, message } = args;

  logger.info(
    "[linkOptimisticMessageToReal] linking optimistic message to real",
    {
      tempId,
      messageId,
    }
  );

  // Update optimistic messages tracking
  const optimisticMessage = optimisticMessages.find(
    (msg) => msg.tempId === tempId
  );
  if (optimisticMessage) {
    optimisticMessage.messageId = messageId;
  }

  // Update query data
  queryClient.setQueryData<ConversationMessagesQueryData>(
    conversationMessagesQueryKey(account, topic),
    (previousMessages) => {
      if (!previousMessages) {
        return previousMessages;
      }

      // Remove the temporary message from the previous messages
      const messagesWithoutTemp = {
        ...previousMessages,
        ids: previousMessages.ids.filter(id => id !== tempId),
        byId: { ...previousMessages.byId }
      };
      delete messagesWithoutTemp.byId[tempId as MessageId];

      // Process the real message
      return processMessages({
        messages: [message],
        existingData: messagesWithoutTemp,
        prependNewMessages: false
      });
    }
  );
}
```

This version:
1. Still updates the optimistic messages tracking
2. Removes the temporary message from the previous messages
3. Uses `processMessages` to handle the addition of the real message
4. Maintains consistency with how other messages are processed in the system

This approach is better because:
- It reuses existing logic
- Ensures consistent message processing
- Will handle any additional processing that might be added to `processMessages` in the future
- Maintains the reactions structure if present

---

_**User**_

We don't have access to addtional arguments, we jsut replace the messageId

---

_**Assistant**_

You're right - let's simplify it to just update the messageId since that's all we have access to:

```typescript
export function linkOptimisticMessageToReal(args: {
  tempId: string;
  messageId: MessageId;
}) {
  const { tempId, messageId } = args;

  logger.info(
    "[linkOptimisticMessageToReal] linking optimistic message to real",
    {
      tempId,
      messageId,
    }
  );

  // Update optimistic messages tracking
  const optimisticMessage = optimisticMessages.find(
    (msg) => msg.tempId === tempId
  );
  if (optimisticMessage) {
    optimisticMessage.messageId = messageId;
  }

  // Update all queries that might contain this message
  queryClient.setQueriesData<ConversationMessagesQueryData>(
    { queryKey: ['conversationMessages'] },
    (previousMessages) => {
      if (!previousMessages) {
        return previousMessages;
      }

      return {
        ...previousMessages,
        ids: previousMessages.ids.map(id => 
          id === tempId ? messageId : id
        ),
        byId: {
          ...previousMessages.byId,
          [messageId]: previousMessages.byId[tempId as MessageId]
        }
      };
    }
  );
}
```

This version:
1. Only takes `tempId` and `messageId` as arguments
2. Updates the optimistic messages tracking
3. Uses `setQueriesData` to update all conversation messages queries
4. Simply replaces the temporary ID with the real message ID in both the `ids` array and `byId` map

The main changes are:
- Removed unnecessary parameters
- Uses `setQueriesData` instead of `setQueryData` to catch all potential queries
- Just updates the IDs without trying to process the message

---



---

