## SpecStory

## Preventing Duplicate Message Processing (12/11/2024, 12:17:13 PM)

_**User**_

can you make sure the same message isn't processed twice? For example it might happen that I call addConversationMessage twice by mistake but I want to make sure it's doesn't processed twice...

---

_**Assistant**_

I'll modify the `processMessages` function to ensure messages aren't processed twice by checking the message ID before processing. Here's the updated code:

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
      // Skip if message already exists
      if (result.byId[messageId]) {
        continue;
      }
      
      result.byId[messageId] = message;
      if (prependNewMessages) {
        result.ids = [messageId, ...result.ids];
      } else if (!result.ids.includes(messageId)) {
        result.ids.push(messageId);
      }
    }
  }

  // Then process reaction messages in reverse order (oldest first)
  for (const message of [...messages].reverse()) {
    if (!isReactionMessage(message)) {
      continue;
    }

    const reactionContent = message.content() as ReactionContent;
    const referenceMessageId = reactionContent?.reference as MessageId;
    const senderAddress = message.senderAddress as InboxId;

    // ... rest of reaction processing code ...
}
```

Key changes made:
1. Added a check `if (result.byId[messageId])` to skip processing if the message already exists in our accumulator
2. Removed console.log statements that were used for debugging
3. The message deduplication happens based on the message ID, which should be unique for each message

This ensures that even if `addConversationMessage` is called multiple times with the same message, it will only be processed and added once to the accumulator.

---

_**User**_

but if it's a reaction message, we also need to make sure that it's not duplicated you know

---

_**Assistant**_

To ensure that reaction messages are not processed twice, we can add a similar check for reaction messages based on their unique identifiers. Here's the updated code:

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
      // Skip if message already exists
      if (result.byId[messageId]) {
        continue;
      }
      
      result.byId[messageId] = message;
      if (prependNewMessages) {
        result.ids = [messageId, ...result.ids];
      } else if (!result.ids.includes(messageId)) {
        result.ids.push(messageId);
      }
    }
  }

  // Then process reaction messages in reverse order (oldest first)
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

    // Check if the reaction already exists
    const existingReactions = messageReactions.bySender[senderAddress] || [];
    const isDuplicateReaction = existingReactions.some(
      (reaction) => reaction.content === reactionContent.content
    );

    if (isDuplicateReaction) {
      continue;
    }

    if (reactionContent.action === "added") {
      messageReactions.byReactionContent[reactionContent.content] = [
        ...(messageReactions.byReactionContent[reactionContent.content] || []),
        senderAddress,
      ];
      messageReactions.bySender[senderAddress] = [
        ...existingReactions,
        reactionContent,
      ];
    } else if (reactionContent.action === "removed") {
      messageReactions.byReactionContent[reactionContent.content] = (
        messageReactions.byReactionContent[reactionContent.content] || []
      ).filter((id) => id !== senderAddress);
      messageReactions.bySender[senderAddress] = existingReactions.filter(
        (reaction) => reaction.content !== reactionContent.content
      );
    }
  }

  return result;
}
```

Key changes made:
- Added a check `isDuplicateReaction` to determine if a reaction from the same sender with the same content already exists.
- If a duplicate reaction is found, the loop continues without processing it again.

This ensures that both regular and reaction messages are not processed more than once.

---

_**User**_

for duplicated reaction we can have many of the same content, we gotta look at the reaction messageId to make sure it wasn't already processed and included in our lists

---

_**Assistant**_



Ah yes, you're absolutely right! We should check the reaction message's ID itself rather than its content. Here's the corrected version:

```typescript:queries/useConversationMessages.ts
type IMessageAccumulator = {
  ids: MessageId[];
  byId: Record<MessageId, DecodedMessageWithCodecsType>;
  reactions: Record<
    MessageId,
    {
      bySender: Record<InboxId, ReactionContent[]>;
      byReactionContent: Record<string, InboxId[]>;
      processedReactionIds: MessageId[]; // Add this to track processed reaction messages
    }
  >;
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

  // First process regular messages
  for (const message of messages) {
    if (!isReactionMessage(message)) {
      const messageId = message.id as MessageId;
      if (result.byId[messageId]) {
        continue;
      }
      
      result.byId[messageId] = message;
      if (prependNewMessages) {
        result.ids = [messageId, ...result.ids];
      } else if (!result.ids.includes(messageId)) {
        result.ids.push(messageId);
      }
    }
  }

  // Then process reaction messages in reverse order
  for (const message of [...messages].reverse()) {
    if (!isReactionMessage(message)) {
      continue;
    }

    const messageId = message.id as MessageId;
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
        processedReactionIds: [],
      };
    }

    const messageReactions = result.reactions[referenceMessageId];

    // Skip if this reaction message was already processed
    if (messageReactions.processedReactionIds.includes(messageId)) {
      continue;
    }

    // Add this reaction message ID to processed list
    messageReactions.processedReactionIds.push(messageId);

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

Key changes made:
1. Added `processedReactionIds` to the `IMessageAccumulator` type to keep track of which reaction messages we've already processed
2. Before processing a reaction, we check if its message ID is in the `processedReactionIds` array
3. After processing a reaction, we add its message ID to the `processedReactionIds` array

This ensures that each reaction message is only processed once, even if it has the same content as other reactions. We're now tracking the actual message IDs of the reactions rather than just their content.

---

_**User**_

Here's the problem that I have, i'm using react-query to add a reaction message in the list using optimitstic update but this message will have a random ID. And then i listen to messages on the server and when I have a new message receive I add it to the list too. so that will cause that i will have 2 messages on that list. One optimistic with random ID and one from the server (the real one), how nca I fix this to only have one

---

_**Assistant**_



Ah, I understand the issue now. For optimistic updates with reactions, we should track both the temporary and real messages using a combination of content and sender. Here's how we can modify the code:

```typescript:queries/useConversationMessages.ts
type IReactionSignature = string; // Format: `${senderAddress}-${content}-${action}-${referenceMessageId}`

type IMessageAccumulator = {
  ids: MessageId[];
  byId: Record<MessageId, DecodedMessageWithCodecsType>;
  reactions: Record<
    MessageId,
    {
      bySender: Record<InboxId, ReactionContent[]>;
      byReactionContent: Record<string, InboxId[]>;
      processedReactionSignatures: IReactionSignature[]; // Changed to track signatures instead of IDs
    }
  >;
};

function getReactionSignature(args: {
  senderAddress: InboxId;
  content: string;
  action: 'added' | 'removed';
  referenceMessageId: MessageId;
}): IReactionSignature {
  const { senderAddress, content, action, referenceMessageId } = args;
  return `${senderAddress}-${content}-${action}-${referenceMessageId}`;
}

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

  // Process regular messages...
  // (regular message processing stays the same)

  // Process reaction messages
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
        processedReactionSignatures: [],
      };
    }

    const messageReactions = result.reactions[referenceMessageId];

    // Create a signature for this reaction
    const reactionSignature = getReactionSignature({
      senderAddress,
      content: reactionContent.content,
      action: reactionContent.action,
      referenceMessageId,
    });

    // Skip if we've already processed this reaction signature
    if (messageReactions.processedReactionSignatures.includes(reactionSignature)) {
      continue;
    }

    // Add this reaction signature to processed list
    messageReactions.processedReactionSignatures.push(reactionSignature);

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

And here's how you would use it with react-query's optimistic updates:

```typescript:queries/useReactionMutation.ts
export function useAddReaction(args: { 
  account: string;
  topic: ConversationTopic;
}) {
  const { account, topic } = args;
  
  return useMutation({
    mutationFn: async (reactionData: { content: string; messageId: MessageId }) => {
      // Your actual mutation logic here
      return await sendReaction(reactionData);
    },
    onMutate: async (newReaction) => {
      // Create optimistic reaction message
      const optimisticReaction: DecodedMessageWithCodecsType = {
        id: `temp-${Date.now()}` as MessageId, // Temporary ID doesn't matter
        senderAddress: account as InboxId,
        content: () => ({
          action: 'added',
          content: newReaction.content,
          reference: newReaction.messageId,
        }),
        // ... other required message properties
      };

      // Add optimistic update
      queryClient.setQueryData<ConversationMessagesQueryData>(
        conversationMessagesQueryKey(account, topic),
        (previous) => {
          return processMessages({
            messages: [optimisticReaction],
            existingData: previous,
            prependNewMessages: true,
          });
        }
      );
    },
  });
}
```

Key changes:
1. Instead of tracking message IDs, we now track reaction signatures that combine the important fields that make a reaction unique (sender, content, action, and reference message)
2. The signature is independent of the message ID, so whether it's an optimistic update or server message, they'll have the same signature
3. This ensures that when the real server message comes in, it won't be processed again if we already have the optimistic update with the same signature

This way, even though the optimistic update has a temporary ID and the server message has a real ID, we only process the reaction once because they share the same signature.

---



---

