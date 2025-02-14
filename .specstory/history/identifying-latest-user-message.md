## SpecStory

## Identifying Latest User Message (12/16/2024, 10:10:51 AM)

_**User**_

i have a list of messages, how can i know if the message is the lastest message that was sent by the current user

---

_**Assistant**_

To determine if a message is the latest one sent by the current user, you'll need to:

1. Get the current user's address
2. Check if the message is from the current user
3. Look through the messages list to find the last message from the current user

Here's how you can modify the `ConversationMessagesListItem` component:

```typescript
const ConversationMessagesListItem = memo(
  function ConversationMessagesListItem(props: {
    message: DecodedMessageWithCodecsType;
    previousMessage: DecodedMessageWithCodecsType | undefined;
    nextMessage: DecodedMessageWithCodecsType | undefined;
  }) {
    const { message, previousMessage, nextMessage } = props;
    const composerStore = useConversationComposerStore();
    const currentAccount = useCurrentAccount()!;

    // Check if this message is from the current user
    const isFromCurrentUser = message.senderAddress === currentAccount.address;
    
    // Check if this is the latest message from the current user
    const isLatestFromCurrentUser = isFromCurrentUser && 
      (!nextMessage || nextMessage.senderAddress !== currentAccount.address);

    const handleReply = useCallback(() => {
      composerStore.getState().setReplyToMessageId(message.id as MessageId);
    }, [composerStore, message]);

    return (
      <MessageContextStoreProvider
        message={message}
        previousMessage={previousMessage}
        nextMessage={nextMessage}
      >
        <VStack>
          <ConversationMessageTimestamp />
          <ConversationMessageRepliable onReply={handleReply}>
            <ConversationMessageLayout>
              <ConversationMessageGestures>
                <ConversationMessage 
                  message={message} 
                  isLatestFromCurrentUser={isLatestFromCurrentUser} 
                />
              </ConversationMessageGestures>
              <ConversationMessageReactions />
              <ConversationMessageStatus message={message} />
            </ConversationMessageLayout>
          </ConversationMessageRepliable>
        </VStack>
      </MessageContextStoreProvider>
    );
  }
);
```

The logic works like this:
1. We check if the current message is from the current user by comparing addresses
2. We check if there are no newer messages from the same user by looking at the `nextMessage`
3. If both conditions are true, this is the latest message from the current user

You can then use the `isLatestFromCurrentUser` prop in your `ConversationMessage` component to render different UI or handle different logic for the latest message.

Note: Make sure to update your `ConversationMessage` component to accept this new prop:

```typescript
type IConversationMessageProps = {
  message: DecodedMessageWithCodecsType;
  isLatestFromCurrentUser: boolean;
}

export const ConversationMessage = memo(function ConversationMessage(props: IConversationMessageProps) {
  const { message, isLatestFromCurrentUser } = props;
  // ... rest of your component logic
});
```

---

_**User**_

but likle what if the next message is not by current user, but the next, next one is?

---

_**Assistant**_

Ah, you're right! To find the truly latest message from the current user, we need to look through all subsequent messages. Here's the corrected version:

```typescript
const ConversationMessagesListItem = memo(
  function ConversationMessagesListItem(props: {
    message: DecodedMessageWithCodecsType;
    previousMessage: DecodedMessageWithCodecsType | undefined;
    nextMessage: DecodedMessageWithCodecsType | undefined;
    messages: { ids: string[]; byId: Record<string, DecodedMessageWithCodecsType> };
  }) {
    const { message, previousMessage, nextMessage, messages } = props;
    const composerStore = useConversationComposerStore();
    const currentAccount = useCurrentAccount()!;

    const isFromCurrentUser = message.senderAddress === currentAccount.address;
    
    // Find if there are any newer messages from the current user
    const hasNewerMessageFromUser = useCallback(() => {
      if (!isFromCurrentUser) return false;
      
      const currentMessageIndex = messages.ids.indexOf(message.id);
      
      // Look through all newer messages (lower indices since array is reversed)
      for (let i = currentMessageIndex - 1; i >= 0; i--) {
        const laterMessage = messages.byId[messages.ids[i]];
        if (laterMessage.senderAddress === currentAccount.address) {
          return true;
        }
      }
      return false;
    }, [messages, message.id, currentAccount.address, isFromCurrentUser]);

    const isLatestFromCurrentUser = isFromCurrentUser && !hasNewerMessageFromUser();

    // ... rest of your component
});
```

And you would need to modify the parent component (`Messages`) to pass the messages data:

```typescript
const Messages = memo(function Messages(props: {
  conversation: ConversationWithCodecsType;
}) {
  // ... existing code ...

  return (
    <ConversationMessagesList
      messageIds={messages?.ids ?? []}
      refreshing={isRefetchingMessages}
      onRefresh={refetch}
      ListEmptyComponent={
        isConversationDm(conversation) ? (
          <DmConversationEmpty />
        ) : (
          <GroupConversationEmpty />
        )
      }
      ListHeaderComponent={
        !isConversationAllowed(conversation) ? (
          isConversationDm(conversation) ? (
            <DmConsentPopup />
          ) : (
            <GroupConsentPopup />
          )
        ) : undefined
      }
      renderMessage={({ messageId, index }) => {
        const message = messages?.byId[messageId]!;
        const previousMessage = messages?.byId[messages?.ids[index + 1]];
        const nextMessage = messages?.byId[messages?.ids[index - 1]];

        return (
          <ConversationMessagesListItem
            message={message}
            previousMessage={previousMessage}
            nextMessage={nextMessage}
            messages={messages!}
          />
        );
      }}
    />
  );
});
```

This solution will:
1. Look through all messages that came after the current message
2. Check if any of those messages were sent by the current user
3. Only mark a message as "latest" if there are no newer messages from the same user

Note that this is more computationally expensive than just checking the next message, but it's the only way to be accurate. If performance becomes an issue, you might want to consider:

1. Memoizing the result
2. Limiting how far you look ahead
3. Or maintaining a separate reference to the latest message from each user in your data structure

---

_**User**_

is this afst?

---

_**Assistant**_

No, this approach isn't optimal for performance since it needs to iterate through messages each time. Here's a more efficient approach using a memoized value:

```typescript
const ConversationMessagesListItem = memo(
  function ConversationMessagesListItem(props: {
    message: DecodedMessageWithCodecsType;
    messageIndex: number;
    latestMessageIndexByUser: number;
  }) {
    const { message, messageIndex, latestMessageIndexByUser } = props;
    const composerStore = useConversationComposerStore();
    const currentAccount = useCurrentAccount()!;

    const isFromCurrentUser = message.senderAddress === currentAccount.address;
    const isLatestFromCurrentUser = isFromCurrentUser && messageIndex === latestMessageIndexByUser;

    // ... rest of your component
});

const Messages = memo(function Messages(props: {
  conversation: ConversationWithCodecsType;
}) {
  const { conversation } = props;
  const currentAccount = useCurrentAccount()!;
  
  // Find latest message index from current user - only computed when messages change
  const latestMessageIndexByUser = useMemo(() => {
    if (!messages?.ids) return -1;
    
    return messages.ids.findIndex(
      (messageId) => messages.byId[messageId].senderAddress === currentAccount.address
    );
  }, [messages?.ids, messages?.byId, currentAccount.address]);

  return (
    <ConversationMessagesList
      messageIds={messages?.ids ?? []}
      refreshing={isRefetchingMessages}
      onRefresh={refetch}
      ListEmptyComponent={/* ... */}
      ListHeaderComponent={/* ... */}
      renderMessage={({ messageId, index }) => {
        const message = messages?.byId[messageId]!;
        const previousMessage = messages?.byId[messages?.ids[index + 1]];
        const nextMessage = messages?.byId[messages?.ids[index - 1]];

        return (
          <ConversationMessagesListItem
            message={message}
            messageIndex={index}
            latestMessageIndexByUser={latestMessageIndexByUser}
            previousMessage={previousMessage}
            nextMessage={nextMessage}
          />
        );
      }}
    />
  );
});
```

This is much more efficient because:
1. We only compute the latest message index once when messages change
2. Each message component just needs to compare its index with the latest index
3. No iteration needed in the message component itself

The tradeoff is a single iteration when messages change vs multiple iterations on every message render in the previous approach.

---



---

