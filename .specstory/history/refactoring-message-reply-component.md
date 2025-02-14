## SpecStory

## Refactoring Message Reply Component (12/19/2024, 10:28:44 AM)

_**User**_

I don't like how this looks... I feel it's not clean and we're repeating ourselves, and I'm also missing some check for content type if we look in @conversation-message.utils.tsx 

---

_**Assistant**_

You're right - there's repetition in handling remote attachments and the code could be cleaner. Let's refactor the `MessageReplyReferenceContent` component to be more consistent with our content type checks and reduce duplication.

```typescript:features/conversation/conversation-message/conversation-message-content-types/conversation-message-reply.tsx
const MessageReplyReferenceContent = memo(
  function ReplyMessageReferenceMessageContent(props: {
    replyMessage: DecodedMessageWithCodecsType;
  }) {
    const { replyMessage } = props;
    const { theme } = useAppTheme();
    const fromMe = useMessageContextStoreContext((s) => s.fromMe);

    const attachmentStyle = {
      height: theme.avatarSize.md,
      width: theme.avatarSize.md,
      marginBottom: theme.spacing.xxxs, // Because with text our lineHeight is 20 so we don't need it but with attachment we need to put that missing 4px (16+4)
      borderRadius:
        theme.borderRadius.message.attachment -
        theme.spacing.message.replyMessage.horizontalPadding, // Simplified the calculation
    };

    // Handle remote attachment messages (both direct and nested in reply)
    if (isRemoteAttachmentMessage(replyMessage) || 
        (isReplyMessage(replyMessage) && replyMessage.content().content.remoteAttachment)) {
      const content = isRemoteAttachmentMessage(replyMessage) 
        ? replyMessage.content()
        : replyMessage.content().content.remoteAttachment;

      return (
        <AttachmentRemoteImage
          messageId={replyMessage.id}
          remoteMessageContent={content}
          containerProps={{ style: attachmentStyle }}
        />
      );
    }

    // Handle text messages (both direct and nested in reply)
    if (isTextMessage(replyMessage) || 
        (isReplyMessage(replyMessage) && replyMessage.content().content.text)) {
      const content = isTextMessage(replyMessage)
        ? replyMessage.content()
        : replyMessage.content().content.text;

      return (
        <Text numberOfLines={1} inverted={fromMe}>
          {content}
        </Text>
      );
    }

    // Handle other message types if needed (transaction reference, coinbase payment, etc.)
    if (isTransactionReferenceMessage(replyMessage)) {
      return (
        <Text numberOfLines={1} inverted={fromMe}>
          Transaction
        </Text>
      );
    }

    if (isCoinbasePaymentMessage(replyMessage)) {
      return (
        <Text numberOfLines={1} inverted={fromMe}>
          Coinbase payment
        </Text>
      );
    }

    captureError(
      new Error(
        `Reply message reference message content is not handled with message content type id ${replyMessage.contentTypeId}`
      )
    );
    return null;
  }
);
```

Key improvements:
1. Consolidated the remote attachment handling logic for both direct and nested reply cases
2. Consolidated the text message handling logic for both direct and nested reply cases
3. Added support for other message types (transaction reference, coinbase payment) that were in the utils but not handled
4. Simplified the style calculation and extracted common styles
5. Made the code more maintainable by grouping similar content types together
6. Removed duplicate code blocks for handling attachments and text

The code now better aligns with the content type checks defined in `conversation-message.utils.tsx` and handles all supported message types in a more organized way.

---

_**User**_

but don't forget a replyMessage can be ANY of the content type... So if it's a replyMessage, we like we need to through all the ifs again...

---

_**Assistant**_

Ah, you're absolutely right! When we have a reply message, we need to recursively check its content against all possible content types. Here's the improved version:

```typescript:features/conversation/conversation-message/conversation-message-content-types/conversation-message-reply.tsx
const MessageReplyReferenceContent = memo(
  function ReplyMessageReferenceMessageContent(props: {
    replyMessage: DecodedMessageWithCodecsType;
  }) {
    const { replyMessage } = props;
    const { theme } = useAppTheme();
    const fromMe = useMessageContextStoreContext((s) => s.fromMe);

    const attachmentStyle = {
      height: theme.avatarSize.md,
      width: theme.avatarSize.md,
      marginBottom: theme.spacing.xxxs,
      borderRadius:
        theme.borderRadius.message.attachment -
        theme.spacing.message.replyMessage.horizontalPadding,
    };

    function renderMessageContent(message: DecodedMessageWithCodecsType) {
      if (isRemoteAttachmentMessage(message)) {
        const content = message.content();
        return (
          <AttachmentRemoteImage
            messageId={message.id}
            remoteMessageContent={content}
            containerProps={{ style: attachmentStyle }}
          />
        );
      }

      if (isTextMessage(message)) {
        return (
          <Text numberOfLines={1} inverted={fromMe}>
            {message.content()}
          </Text>
        );
      }

      if (isTransactionReferenceMessage(message)) {
        return (
          <Text numberOfLines={1} inverted={fromMe}>
            Transaction
          </Text>
        );
      }

      if (isCoinbasePaymentMessage(message)) {
        return (
          <Text numberOfLines={1} inverted={fromMe}>
            Coinbase payment
          </Text>
        );
      }

      if (isReplyMessage(message)) {
        const content = message.content();
        
        if (content.content.remoteAttachment) {
          return (
            <AttachmentRemoteImage
              messageId={message.id}
              remoteMessageContent={content.content.remoteAttachment}
              containerProps={{ style: attachmentStyle }}
            />
          );
        }

        if (content.content.text) {
          return (
            <Text numberOfLines={1} inverted={fromMe}>
              {content.content.text}
            </Text>
          );
        }

        // If the reply contains another message, recursively render it
        if (content.content.reply) {
          // Create a synthetic message from the nested reply content
          const nestedMessage = {
            ...message,
            content: () => content.content.reply,
            contentTypeId: content.content.reply.contentType,
          } as DecodedMessageWithCodecsType;
          
          return renderMessageContent(nestedMessage);
        }
      }

      captureError(
        new Error(
          `Reply message reference message content is not handled with message content type id ${message.contentTypeId}`
        )
      );
      return null;
    }

    return renderMessageContent(replyMessage);
  }
);
```

Key changes:
1. Created a `renderMessageContent` helper function that handles all possible message types
2. Added recursive handling for nested reply messages
3. Maintained all the content type checks from the utils
4. Kept the same visual styling and error handling
5. Made the code more maintainable by centralizing the content rendering logic

Now the component can handle:
- Direct content (text, remote attachment, etc.)
- Reply messages containing any of these content types
- Nested reply messages (replies to replies)
- All other message types defined in the utils

This approach is more robust and correctly handles the recursive nature of reply messages while maintaining type safety.

---

_**User**_

but "content.reply" doesn't exist....

---

_**Assistant**_



Ah you're right, I apologize! Looking at the `ReplyContent` type from the code snippets, the structure is `content.content` not `content.reply`. Here's the corrected version:

```typescript:features/conversation/conversation-message/conversation-message-content-types/conversation-message-reply.tsx
const MessageReplyReferenceContent = memo(
  function ReplyMessageReferenceMessageContent(props: {
    replyMessage: DecodedMessageWithCodecsType;
  }) {
    const { replyMessage } = props;
    const { theme } = useAppTheme();
    const fromMe = useMessageContextStoreContext((s) => s.fromMe);

    const attachmentStyle = {
      height: theme.avatarSize.md,
      width: theme.avatarSize.md,
      marginBottom: theme.spacing.xxxs,
      borderRadius:
        theme.borderRadius.message.attachment -
        theme.spacing.message.replyMessage.horizontalPadding,
    };

    function renderMessageContent(message: DecodedMessageWithCodecsType) {
      if (isRemoteAttachmentMessage(message)) {
        const content = message.content();
        return (
          <AttachmentRemoteImage
            messageId={message.id}
            remoteMessageContent={content}
            containerProps={{ style: attachmentStyle }}
          />
        );
      }

      if (isTextMessage(message)) {
        return (
          <Text numberOfLines={1} inverted={fromMe}>
            {message.content()}
          </Text>
        );
      }

      if (isTransactionReferenceMessage(message)) {
        return (
          <Text numberOfLines={1} inverted={fromMe}>
            Transaction
          </Text>
        );
      }

      if (isCoinbasePaymentMessage(message)) {
        return (
          <Text numberOfLines={1} inverted={fromMe}>
            Coinbase payment
          </Text>
        );
      }

      if (isReplyMessage(message)) {
        const content = message.content();

        // Handle remote attachment in the reply
        if (content.content.remoteAttachment) {
          return (
            <AttachmentRemoteImage
              messageId={message.id}
              remoteMessageContent={content.content.remoteAttachment}
              containerProps={{ style: attachmentStyle }}
            />
          );
        }

        // Handle text in the reply
        if (content.content.text) {
          return (
            <Text numberOfLines={1} inverted={fromMe}>
              {content.content.text}
            </Text>
          );
        }

        // Handle static attachment in the reply
        if (content.content.attachment) {
          return (
            <Text numberOfLines={1} inverted={fromMe}>
              {content.content.attachment.filename}
            </Text>
          );
        }

        // Handle group updates in the reply
        if (content.content.groupUpdated) {
          return (
            <Text numberOfLines={1} inverted={fromMe}>
              Group updated
            </Text>
          );
        }
      }

      captureError(
        new Error(
          `Reply message reference message content is not handled with message content type id ${message.contentTypeId}`
        )
      );
      return null;
    }

    return renderMessageContent(replyMessage);
  }
);
```

The changes:
1. Removed the incorrect `content.reply` reference
2. Added handling for all possible content types within a reply message based on the `ReplyContent` type
3. Added support for static attachments and group updates within replies
4. Maintained the same error handling and styling

This version should now correctly handle all the possible content types that can appear in both direct messages and reply messages.

---



---

