## SpecStory

## Optimizing Chat Message Rendering (12/20/2024, 9:42:05 AM)

_**User**_

here's the prlblem I have and want to solve. Here I pass messageIds for data, but in my chat app i use optimistic message so when someone send a message I add a message to the list but the ID is random and then few seconds later when the actaul message is sent, I replace the randomID with the real ID, but that makes the list rerender because it sees that a messageId was removed and a new one was added... But Ideally for UX I  wouldn't want to rerender the list you know?

---

_**Assistant**_

I understand the problem. Instead of using messageIds as the data source and key, we should use a stable identifier that doesn't change when the message is confirmed. Here's how we can modify the code:

```typescript:features/conversation/conversation-messages-list.tsx
// First, let's create a type for our stable message identifier
type IStableMessageId = {
  clientId: string; // This will be our stable ID that doesn't change
  messageId: MessageId; // The actual XMTP message ID that can change
};

// Update the component props
export const ConversationMessagesList = memo(function ConversationMessagesList(
  props: Omit<
    AnimatedProps<FlatListProps<IStableMessageId>>,
    "renderItem" | "data"
  > & {
    messages: IStableMessageId[];
    renderMessage: (args: {
      messageId: MessageId;
      clientId: string;
      index: number;
    }) => ReactElement;
  }
) {
  const { messages, renderMessage, ...rest } = props;

  // ... existing code ...

  return (
    <Animated.FlatList
      inverted={true}
      ref={scrollRef}
      data={messages}
      renderItem={({ item, index }) => (
        <AnimatedChatItem index={index}>
          {renderMessage({
            messageId: item.messageId,
            clientId: item.clientId,
            index,
          })}
        </AnimatedChatItem>
      )}
      keyExtractor={(item) => item.clientId} // Use clientId as the stable key
      // ... rest of the props ...
    />
  );
});
```

The key changes are:
1. Created an `IStableMessageId` type that includes both the stable client ID and the actual message ID
2. Updated the component to use this new type
3. Changed the keyExtractor to use the clientId instead of messageId

When using this component, you would need to:
1. Generate a stable clientId when creating an optimistic message (e.g., using uuid)
2. Keep that same clientId when updating the message with the real messageId
3. Pass an array of `IStableMessageId` instead of just messageIds

This way, React's reconciliation will see the same key (clientId) before and after the message is confirmed, preventing unnecessary rerenders.

Example usage in your message creation logic:
```typescript
// When sending a message
const clientId = uuid();
const optimisticMessage = {
  clientId,
  messageId: `temp-${clientId}` as MessageId,
};

// When message is confirmed
const confirmedMessage = {
  clientId, // Same clientId as before
  messageId: realMessageIdFromXMTP,
};
```

---



---

