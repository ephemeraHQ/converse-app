## SpecStory

## Handling Message Reaction Order Issues (12/11/2024, 12:09:09 PM)

_**User**_

problem i have here for the removing reaction, i think it won't work because how message are fetched. For example the 1st message is the newest message, but if it's a removed reaction, it will be processed first as removed but then readded later but actually the final results should be that the reaction is removed because the lastest reaction action is removed... see what i mean?

---

_**Assistant**_

Ah yes, I understand the problem. Since messages are processed in chronological order (newest first), we might process a "remove" reaction before processing the original "add" reaction, leading to incorrect final state. We need to ensure that reactions are processed in the correct temporal order.

Here's how we can fix the `processMessages` function:

```typescript:queries/useConversationMessages.ts
function processMessages(args: {
  messages: DecodedMessageWithCodecsType[];
  existingData?: IMessageAccumulator;
  prependNewMessages?: boolean;
}): IMessageAccumulator {
  const { messages, existingData, prependNewMessages = false } = args;

  const result: IMessageAccumulator = existingData ?? {
    ids: [],
    byId: {},
    reactions: {},
  };

  // First process regular messages
  for (const message of messages) {
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

  // Then process reaction messages in reverse order (oldest first)
  // This ensures the final state reflects the most recent reaction action
  for (const message of [...messages].reverse()) {
    if (!isReactionMessage(message)) {
      continue;
    }

    const reactionContent = message.content() as ReactionContent;
    const referenceMessageId = reactionContent?.reference as MessageId;
    const senderAddress = message.senderAddress as InboxId;

    if (!reactionContent || !referenceMessageId) {
      continue;
    }

    if (!result.reactions[referenceMessageId]) {
      result.reactions[referenceMessageId] = {
        bySender: {},
        byReactionContent: {},
      };
    }

    const messageReactions = result.reactions[referenceMessageId];

    // ... rest of reaction processing remains the same ...
}
```

The key changes are:
1. Split the processing into two phases: first regular messages, then reactions
2. Process reaction messages in reverse chronological order using `[...messages].reverse()`
3. This ensures that the most recent reaction action (add/remove) for each sender/content combination will be the final state

This way, if we have a sequence like:
1. Add reaction (older message)
2. Remove reaction (newer message)

Processing them in reverse order will correctly result in the reaction being removed in the final state.

---



---

