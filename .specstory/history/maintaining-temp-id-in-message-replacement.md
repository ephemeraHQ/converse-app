## SpecStory

## Maintaining Temp ID in Message Replacement (1/17/2025, 8:44:30 AM)

_**User**_

when replacing the message we NEED to keep the "tempOptimisticId"

---

_**Assistant**_

I'll help modify the `replaceOptimisticMessageWithReal` function to maintain the temporary optimistic ID while still linking it to the real message. Here's how we can update it:

```typescript:queries/use-conversation-messages-query.ts
// ... existing code ...

export function replaceOptimisticMessageWithReal(args: {
  tempId: string;
  topic: ConversationTopic;
  account: string;
  message: DecodedMessageWithCodecsType;
}) {
  const { tempId, topic, account, message } = args;
  logger.debug(
    "[linkOptimisticMessageToReal] linking optimistic message to real",
    {
      tempId,
      messageId: message.id,
    }
  );

  queryClient.setQueryData(
    getConversationMessagesQueryOptions(account, topic).queryKey,
    (previousMessages) => {
      if (!previousMessages) {
        return {
          ids: [message.id as MessageId],
          byId: {
            [message.id as MessageId]: {
              ...message,
              tempOptimisticId: tempId,
            },
          },
          reactions: {},
        };
      }

      // Find the index of the temporary message
      const tempIndex = previousMessages.ids.indexOf(tempId as MessageId);

      if (tempIndex === -1) {
        return previousMessages;
      }

      // Create new ids array with the real message id replacing the temp id
      const newIds = [...previousMessages.ids];
      newIds[tempIndex] = message.id as MessageId;

      // Create new byId object preserving order
      const newById: typeof previousMessages.byId = {};
      for (const id of previousMessages.ids) {
        if (id === (tempId as MessageId)) {
          newById[message.id as MessageId] = {
            ...message,
            tempOptimisticId: tempId,
          };
        } else {
          newById[id] = previousMessages.byId[id];
        }
      }

      return {
        ...previousMessages,
        ids: newIds,
        byId: newById,
      };
    }
  );
}

// ... existing code ...
```

The key changes are:
1. Added `tempOptimisticId: tempId` to the message object when creating a new message in both the no-previous-messages case and the replacement case
2. When replacing the message, we spread the original message properties and add the `tempOptimisticId` field

This ensures that the temporary ID is preserved in the message object even after it's replaced with the real message, which can be useful for tracking or reference purposes.

---



---

