## SpecStory

## Refactoring Message Handling Logic (12/11/2024, 12:07:01 PM)

_**User**_

How can we maybe have 1 function that will go through messages and add them in the right list, or remove (for reaction sfor example). Because right now we are doing stuff in the query function and in the addConversationMessage

---

_**Assistant**_

I'll help you refactor this to create a shared function for handling messages. Here's how we can consolidate the message processing logic:

```typescript:queries/useConversationMessages.ts
// ... existing imports ...

type IMessageAccumulator = {
  ids: MessageId[];
  byId: Record<MessageId, DecodedMessageWithCodecsType>;
  reactions: Record<
    MessageId,
    {
      bySender: Record<InboxId, ReactionContent[]>;
      byReactionContent: Record<string, InboxId[]>;
    }
  >;
};

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

  for (const message of messages) {
    if (!isReactionMessage(message)) {
      const messageId = message.id as MessageId;
      result.byId[messageId] = message;
      if (prependNewMessages) {
        result.ids = [messageId, ...result.ids];
      } else if (!result.ids.includes(messageId)) {
        result.ids.push(messageId);
      }
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

// Update conversationMessagesQueryFn to use the new function
export const conversationMessagesQueryFn = async (
  conversation: ConversationWithCodecsType,
  options?: MessagesOptions
) => {
  logger.info("[useConversationMessages] queryFn fetching messages");

  if (!conversation) {
    throw new Error("Conversation not found in conversationMessagesQueryFn");
  }

  const messages = await conversation.messages(options);
  return processMessages({ messages });
};

// Update addConversationMessage to use the new function
export const addConversationMessage = (
  account: string,
  topic: ConversationTopic,
  message: DecodedMessageWithCodecsType
) => {
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

// ... rest of the file remains unchanged ...
```

Key changes made:
1. Created a shared `processMessages` function that handles both initial message loading and message additions
2. Added a `prependNewMessages` flag to handle the different ordering needs (prepend for new messages, append for initial load)
3. Created an `IMessageAccumulator` type to better type the accumulated data
4. Simplified both `conversationMessagesQueryFn` and `addConversationMessage` by using the shared function
5. The shared function handles both regular messages and reactions in a consistent way

This refactoring makes the code more maintainable and reduces duplication while keeping the same functionality. The logic for processing messages is now centralized in one place, making it easier to modify or debug in the future.

---



---

