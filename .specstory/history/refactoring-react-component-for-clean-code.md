## SpecStory

## Refactoring React Component for Clean Code (11/25/2024, 2:33:53 PM)

_**User**_

I'm repating teh same provider and stuff for each type of message , how can im ake this cleanre

---

_**Assistant**_

To make your code cleaner and avoid repetition, you can extract the common logic into a separate component or function. This will help you manage the repeated `MessageContextStoreProvider` and `MessageContextProvider` logic. Here's how you can refactor your code:

1. Create a new component `MessageWrapper` that will handle the common logic.
2. Use this component in your `V3Message` component.

Here's how you can implement this:

```typescript:components/Chat/Message/V3Message.tsx
function MessageWrapper({
  message,
  children,
  _hasNextMessageInSeries,
  _hasPreviousMessageInSeries,
  showDateChange,
  fromMe,
}: {
  message: DecodedMessage<any>;
  children: React.ReactNode;
  _hasNextMessageInSeries: boolean;
  _hasPreviousMessageInSeries: boolean;
  showDateChange: boolean;
  fromMe: boolean;
}) {
  return (
    <MessageContextStoreProvider
      messageId={message.id as MessageId}
      hasNextMessageInSeries={_hasNextMessageInSeries}
      fromMe={fromMe}
      sentAt={convertNanosecondsToMilliseconds(message.sentNs)}
      showDateChange={showDateChange}
      hasPreviousMessageInSeries={_hasPreviousMessageInSeries}
      senderAddress={message.senderAddress as InboxId}
    >
      <MessageContextProvider>{children}</MessageContextProvider>
    </MessageContextStoreProvider>
  );
}

export const V3Message = memo(
  ({ messageId, nextMessageId, previousMessageId }: V3MessageProps) => {
    const messages = getCurrentConversationMessages();
    const { theme } = useAppTheme();

    const message = messages?.byId[messageId];
    const previousMessage = messages?.byId[previousMessageId ?? ""];
    const nextMessage = messages?.byId[nextMessageId ?? ""];

    const _hasPreviousMessageInSeries =
      !!previousMessage &&
      hasPreviousMessageInSeries({
        currentMessage: message,
        previousMessage,
      });

    const _hasNextMessageInSeries = Boolean(
      !!nextMessage &&
        message &&
        hasNextMessageInSeries({
          currentMessage: message,
          nextMessage,
        })
    );

    const showDateChange = messageShouldShowDateChange({
      message,
      previousMessage,
    });

    const fromMe = messageIsFromCurrentUserV3({
      message,
    });

    if (isReplyMessage(message)) {
      return (
        <MessageWrapper
          message={message}
          _hasNextMessageInSeries={_hasNextMessageInSeries}
          _hasPreviousMessageInSeries={_hasPreviousMessageInSeries}
          showDateChange={showDateChange}
          fromMe={fromMe}
        >
          <ReplyMessage />
        </MessageWrapper>
      );
    }

    if (isTextMessage(message)) {
      const messageTyped = message as DecodedMessage<[TextCodec]>;
      const textContent = messageTyped.content();

      return (
        <MessageWrapper
          message={messageTyped}
          _hasNextMessageInSeries={_hasNextMessageInSeries}
          _hasPreviousMessageInSeries={_hasPreviousMessageInSeries}
          showDateChange={showDateChange}
          fromMe={fromMe}
        >
          <SimpleMessage message={textContent} />
        </MessageWrapper>
      );
    }

    if (isGroupUpdatedMessage(message)) {
      const messageTyped = message as DecodedMessage<[GroupUpdatedCodec]>;
      const content = messageTyped.content();

      if (typeof content === "string") {
        console.error("group updated message is a string");
        return null;
      }

      return (
        <MessageWrapper
          message={messageTyped}
          _hasNextMessageInSeries={_hasNextMessageInSeries}
          _hasPreviousMessageInSeries={_hasPreviousMessageInSeries}
          showDateChange={showDateChange}
          fromMe={fromMe}
        >
          <VStack style={{ paddingVertical: theme.spacing.sm }}>
            <MessageTime />
            <ChatGroupUpdatedMessage content={content} />
          </VStack>
        </MessageWrapper>
      );
    }

    if (isRemoteAttachmentMessage(message)) {
      return (
        <MessageWrapper
          message={message}
          _hasNextMessageInSeries={_hasNextMessageInSeries}
          _hasPreviousMessageInSeries={_hasPreviousMessageInSeries}
          showDateChange={showDateChange}
          fromMe={fromMe}
        >
          <RemoteAttachmentMessage message={message} />
        </MessageWrapper>
      );
    }

    // Handle other message types similarly...

    throw new Error("Unknown message type");
    return null;
  }
);
```

### Explanation:
- **`MessageWrapper` Component**: This component encapsulates the repeated logic of providing context to the message. It takes the message and other necessary props and wraps the children components with the necessary providers.
- **Usage in `V3Message`**: Instead of repeating the provider logic for each message type, you now use the `MessageWrapper` component, passing the specific message and its related components as children. This makes the code cleaner and easier to maintain.

---



---

