## SpecStory

## Handling Reaction Signature Processing Issues (12/11/2024, 12:32:16 PM)

_**User**_

here's the other problem we have with "processedReactionSignatures" is let's say someone added, removed, added a reaction. Then we first process the 1st added, then the removed, but then when we're ready to process the last added which will add the reaction, we won't because it will be skipped because of "processedReactionsSignatures"...

---

_**Assistant**_

Ah, I see the issue. The current implementation with `processedReactionSignatures` prevents processing the same reaction signature more than once, but we actually want to process the most recent action for each unique combination of sender and reaction. Let's modify the code to track the latest action instead of skipping duplicates.

```typescript:queries/useConversationMessages.ts
type IMessageAccumulator = {
  ids: MessageId[];
  byId: Record<MessageId, DecodedMessageWithCodecsType>;
  reactions: Record<
    MessageId,
    {
      bySender: Record<InboxId, ReactionContent[]>;
      byReactionContent: Record<string, InboxId[]>;
      latestReactionActions: Record<IReactionSignature, string>; // Track latest action instead of just signatures
    }
  >;
};

function processMessages(args: {
  messages: DecodedMessageWithCodecsType[];
  existingData?: IMessageAccumulator;
  prependNewMessages?: boolean;
}): IMessageAccumulator {
  // ... existing code ...

  // Inside the reaction processing loop
  if (!result.reactions[referenceMessageId]) {
    result.reactions[referenceMessageId] = {
      bySender: {},
      byReactionContent: {},
      latestReactionActions: {},
    };
  }

  const messageReactions = result.reactions[referenceMessageId];

  const reactionSignature = getReactionSignature({
    senderAddress,
    content: reactionContent.content,
    action: reactionContent.action,
    referenceMessageId,
  });

  // Check if this is a newer action than what we've seen before
  const previousAction = messageReactions.latestReactionActions[reactionSignature];
  if (previousAction === reactionContent.action) {
    // Skip if we've already processed this exact action
    continue;
  }

  // Update the latest action for this reaction signature
  messageReactions.latestReactionActions[reactionSignature] = reactionContent.action;

  if (reactionContent.action === "added") {
    // ... existing added logic ...
  } else if (reactionContent.action === "removed") {
    // ... existing removed logic ...
  }

  // ... rest of the code ...
}
```

The key changes are:
1. Replaced `processedReactionSignatures` with `latestReactionActions` which tracks the most recent action for each reaction signature
2. Instead of skipping all duplicate signatures, we now only skip if we've already processed the same action
3. This allows the sequence "added -> removed -> added" to work correctly, as each different action will be processed

This way, if someone adds, removes, then adds a reaction again, all actions will be processed in order and the final state will correctly reflect the last action taken.

---

_**User**_

doesn't work

---

_**Assistant**_

Let's debug this. The issue might be with the order of processing since we're using `.reverse()` on the messages array. Let's modify the approach to ensure we're always getting the latest state:

```typescript:queries/useConversationMessages.ts
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

  // Process reactions in chronological order (newest last)
  // This ensures the final state reflects the most recent action
  for (const message of messages) {
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
        latestReactionActions: {},
      };
    }

    const messageReactions = result.reactions[referenceMessageId];

    // Always process the reaction - the order of messages will determine the final state
    if (reactionContent.action === "added") {
      messageReactions.byReactionContent[reactionContent.content] = [
        ...(messageReactions.byReactionContent[reactionContent.content] || []),
        senderAddress,
      ];
      messageReactions.bySender[senderAddress] = [
        ...(messageReactions.bySender[senderAddress] || []),
        reactionContent,
      ];
    } else if (reactionContent.action === "removed") {
      messageReactions.byReactionContent[reactionContent.content] = (
        messageReactions.byReactionContent[reactionContent.content] || []
      ).filter((id) => id !== senderAddress);
      messageReactions.bySender[senderAddress] = (
        messageReactions.bySender[senderAddress] || []
      ).filter((reaction) => reaction.content !== reactionContent.content);
    }
  }

  return result;
}
```

Key changes:
1. Removed the `.reverse()` and the signature tracking completely
2. Process messages in their natural order (assuming newer messages come later)
3. Always process each reaction action, letting the chronological order determine the final state
4. Simplified the logic by removing the signature checking

This should now correctly handle the add -> remove -> add sequence, as each action will be processed in order and the final state will reflect the last action taken.

---

_**User**_

but wen eed the reverse no? because we only care about the latest reaction for a message

---

_**Assistant**_



Ah yes, you're right! Let's combine both approaches - we'll process in reverse order (newest first) but also ensure we only process the first occurrence of each unique reaction (since that will be the latest one):

```typescript:queries/useConversationMessages.ts
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

  // Track which reactions we've already processed
  const processedReactions = new Set<string>();

  // Process reactions in reverse order (newest first)
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

    // Create a unique key for this sender + content combination
    const reactionKey = `${senderAddress}-${reactionContent.content}-${referenceMessageId}`;
    
    // Skip if we've already processed a reaction from this sender for this content
    if (processedReactions.has(reactionKey)) {
      continue;
    }
    
    // Mark this reaction as processed
    processedReactions.add(reactionKey);

    if (!result.reactions[referenceMessageId]) {
      result.reactions[referenceMessageId] = {
        bySender: {},
        byReactionContent: {},
        latestReactionActions: {},
      };
    }

    const messageReactions = result.reactions[referenceMessageId];

    if (reactionContent.action === "added") {
      messageReactions.byReactionContent[reactionContent.content] = [
        ...(messageReactions.byReactionContent[reactionContent.content] || []),
        senderAddress,
      ];
      messageReactions.bySender[senderAddress] = [
        ...(messageReactions.bySender[senderAddress] || []),
        reactionContent,
      ];
    } else if (reactionContent.action === "removed") {
      messageReactions.byReactionContent[reactionContent.content] = (
        messageReactions.byReactionContent[reactionContent.content] || []
      ).filter((id) => id !== senderAddress);
      messageReactions.bySender[senderAddress] = (
        messageReactions.bySender[senderAddress] || []
      ).filter((reaction) => reaction.content !== reactionContent.content);
    }
  }

  return result;
}
```

Key changes:
1. Kept the `.reverse()` to process newest messages first
2. Added a `processedReactions` Set to track which unique sender+content+message combinations we've already processed
3. Only process the first occurrence of each unique reaction (which will be the latest one since we're going in reverse)
4. Simplified the tracking by using a simple Set instead of the more complex signature system

This should now correctly handle all reaction sequences while ensuring we only use the latest reaction state for each sender+content combination.

---



---

