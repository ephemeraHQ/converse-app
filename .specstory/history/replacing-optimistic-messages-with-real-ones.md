## SpecStory

## Replacing Optimistic Messages with Real Ones (12/16/2024, 10:44:05 AM)

_**User**_

replace the optimsitcMessage with the real one

---

_**Assistant**_

I'll help you modify the `replaceOptimisticMessageWithReal` function to properly replace the optimistic message with the real one. Here's the improved version:

```typescript
export function replaceOptimisticMessageWithReal(args: {
  tempId: string;
  message: DecodedMessageWithCodecsType;
}) {
  const { tempId, message } = args;
  
  logger.info("[replaceOptimisticMessageWithReal] replacing optimistic message", {
    tempId,
    messageId: message.id,
  });

  // Find and update the optimistic message
  const optimisticMessage = optimisticMessages.find(
    (msg) => msg.tempId === tempId
  );

  if (optimisticMessage) {
    optimisticMessage.messageId = message.id;
  }

  queryClient.setQueryData(
    conversationMessagesQueryKey(message.senderAddress, message.topic),
    (previousMessages: IMessageAccumulator | undefined) => {
      if (!previousMessages) {
        return {
          ids: [message.id],
          byId: {
            [message.id]: message,
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
      newIds[tempIndex] = message.id;

      // Create new byId object without the temp message and with the real message
      const newById = { ...previousMessages.byId };
      delete newById[tempId as MessageId];
      newById[message.id] = message;

      return {
        ...previousMessages,
        ids: newIds,
        byId: newById,
      };
    }
  );
}
```

This improved version:

1. Updates the optimistic message tracking by setting the real `messageId`
2. Properly handles the case when there are no previous messages
3. Finds the temporary message in the `ids` array and replaces it with the real message id
4. Removes the temporary message from `byId` and adds the real message
5. Maintains the message order by replacing the temp id with the real id at the same position
6. Preserves all other data in the accumulator (like reactions)

The function now properly maintains the message order and cleanly transitions from the optimistic to the real message state.

---

_**User**_

For the code present, we get this error:
```
Argument of type '(previousMessages: IMessageAccumulator | undefined) => IMessageAccumulator | { ids: string[]; byId: { [x: string]: DecodedMessage<TextCodec, SupportedCodecsType> | ... 7 more ... | DecodedMessage<...>; }; reactions: {}; }' is not assignable to parameter of type 'Updater<IMessageAccumulator | undefined, IMessageAccumulator | undefined>'.
  Type '(previousMessages: IMessageAccumulator | undefined) => IMessageAccumulator | { ids: string[]; byId: { [x: string]: DecodedMessage<TextCodec, SupportedCodecsType> | ... 7 more ... | DecodedMessage<...>; }; reactions: {}; }' is not assignable to type '(input: IMessageAccumulator | undefined) => IMessageAccumulator | undefined'.
    Type 'IMessageAccumulator | { ids: string[]; byId: { [x: string]: DecodedMessage<TextCodec, SupportedCodecsType> | ... 7 more ... | DecodedMessage<...>; }; reactions: {}; }' is not assignable to type 'IMessageAccumulator | undefined'.
      Type '{ ids: string[]; byId: { [x: string]: DecodedMessage<TextCodec, SupportedCodecsType> | DecodedMessage<ReactionCodec, SupportedCodecsType> | ... 6 more ... | DecodedMessage<...>; }; reactions: {}; }' is not assignable to type 'IMessageAccumulator'.
        Types of property 'ids' are incompatible.
          Type 'string[]' is not assignable to type 'MessageId[]'.
            Type 'string' is not assignable to type 'MessageId'.
              Type 'string' is not assignable to type '{ readonly brand: unique symbol; }'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error is due to type mismatch with `MessageId`. Here's the fix:

```typescript
return {
  ...previousMessages,
  ids: newIds as MessageId[],  // Cast the ids array to MessageId[]
  byId: newById,
};
```

The key change is casting the `ids` array to `MessageId[]` since TypeScript needs help understanding that our string IDs are actually `MessageId` types.

---



---

