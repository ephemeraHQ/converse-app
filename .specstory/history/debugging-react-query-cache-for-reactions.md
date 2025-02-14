## SpecStory

## Debugging React Query Cache for Reactions (12/5/2024, 11:11:25 AM)

_**User**_

Why does this query cache update doenst work for reactions??? Look online. Am i doing something wrong with react-query?

---

_**Assistant**_

The issue with the query cache update for reactions might be related to how you're updating the cache with `setConversationMessages`. Here are a few things to consider and check:

1. **Immutable Updates**: Ensure that you're not mutating the existing state directly. In your code, you are creating a new object for `newPreviousMessages`, which is good. However, make sure that all nested objects are also being copied correctly.

2. **Query Key Consistency**: Double-check that the `conversationMessagesQueryKey` function is returning the correct and consistent key for the query you are trying to update. Any mismatch in the key will result in the cache not being updated as expected.

3. **React-Query Cache Update**: When you call `setQueryData`, ensure that the data structure you pass matches the expected structure of the query. If the structure is different, React Query might not recognize it as a valid update.

4. **Reactivity**: Ensure that the component consuming this query is set up to re-render when the query data changes. This typically involves using hooks like `useQuery` or `useQueryClient` to access the data.

5. **Debugging**: Add some console logs to verify that the `setConversationMessages` function is being called with the expected data and that the cache is being updated.

Here's a simplified version of your `addConversationMessage` function with some comments for clarity:

```typescript:queries/useConversationMessages.ts
export const addConversationMessage = (
  account: string,
  topic: ConversationTopic,
  message: DecodedMessageWithCodecsType
) => {
  const previousMessages = getConversationMessages(account, topic);

  if (!previousMessages) {
    setConversationMessages(account, topic, {
      ids: [message.id as MessageId],
      byId: { [message.id]: message },
      reactions: {},
    });
    return;
  }

  const newPreviousMessages = { ...previousMessages };

  newPreviousMessages.byId[message.id as MessageId] = message;
  newPreviousMessages.ids = [
    message.id as MessageId,
    ...newPreviousMessages.ids,
  ];

  if (isReactionMessage(message)) {
    const reactionContent = message.content() as ReactionContent;
    const reactionContentString = reactionContent.content;
    const messageId = message.id as MessageId;
    const senderAddress = message.senderAddress as InboxId;

    const existingReactions = newPreviousMessages.reactions[messageId];

    if (existingReactions) {
      newPreviousMessages.reactions = {
        ...newPreviousMessages.reactions,
        [messageId]: {
          bySender: {
            ...existingReactions.bySender,
            [senderAddress]: [
              ...(existingReactions.bySender[senderAddress] || []),
              reactionContent,
            ],
          },
          byReactionContent: {
            ...existingReactions.byReactionContent,
            [reactionContentString]: [
              ...(existingReactions.byReactionContent[reactionContentString] ||
                []),
              senderAddress,
            ],
          },
        },
      };
    } else {
      newPreviousMessages.reactions = {
        ...newPreviousMessages.reactions,
        [messageId]: {
          bySender: {
            [senderAddress]: [reactionContent],
          },
          byReactionContent: {
            [reactionContentString]: [senderAddress],
          },
        },
      };
    }
  }

  setConversationMessages(account, topic, newPreviousMessages);
};
```

### Additional Suggestions

- **Check for Errors**: Use `.throwOnError()` if available to ensure that any errors in the query are surfaced immediately.
- **React Query Devtools**: If you haven't already, consider using React Query Devtools to inspect the cache and see if the updates are being applied as expected.

If the issue persists, consider isolating the problem by creating a minimal reproducible example and testing the cache update logic separately. This can help identify if the problem lies within the cache update logic or elsewhere in the application.

---

_**User**_

cany you fix so i'm not mutatting the existing object

---

_**Assistant**_

Certainly! To ensure that you're not mutating the existing object, you should create new objects for any nested structures that you modify. Here's how you can refactor the `addConversationMessage` function to avoid direct mutations:

```typescript:queries/useConversationMessages.ts
export const addConversationMessage = (
  account: string,
  topic: ConversationTopic,
  message: DecodedMessageWithCodecsType
) => {
  const previousMessages = getConversationMessages(account, topic);

  if (!previousMessages) {
    setConversationMessages(account, topic, {
      ids: [message.id as MessageId],
      byId: { [message.id]: message },
      reactions: {},
    });
    return;
  }

  // Create a new object for the updated messages
  const newPreviousMessages = {
    ...previousMessages,
    byId: {
      ...previousMessages.byId,
      [message.id as MessageId]: message,
    },
    ids: [message.id as MessageId, ...previousMessages.ids],
  };

  if (isReactionMessage(message)) {
    const reactionContent = message.content() as ReactionContent;
    const reactionContentString = reactionContent.content;
    const messageId = message.id as MessageId;
    const senderAddress = message.senderAddress as InboxId;

    const existingReactions = previousMessages.reactions[messageId] || {
      bySender: {},
      byReactionContent: {},
    };

    // Create new objects for reactions
    newPreviousMessages.reactions = {
      ...previousMessages.reactions,
      [messageId]: {
        bySender: {
          ...existingReactions.bySender,
          [senderAddress]: [
            ...(existingReactions.bySender[senderAddress] || []),
            reactionContent,
          ],
        },
        byReactionContent: {
          ...existingReactions.byReactionContent,
          [reactionContentString]: [
            ...(existingReactions.byReactionContent[reactionContentString] ||
              []),
            senderAddress,
          ],
        },
      },
    };
  }

  setConversationMessages(account, topic, newPreviousMessages);
};
```

### Key Changes:

- **Immutable Updates**: For each nested object (`byId`, `reactions`, `bySender`, `byReactionContent`), a new object is created using the spread operator. This ensures that the original objects are not mutated.
- **Default Values**: When accessing `existingReactions`, a default structure is provided to handle cases where no reactions exist yet.

This approach ensures that all updates to the state are done immutably, which is crucial for React Query to detect changes and trigger re-renders appropriately.

---



---

