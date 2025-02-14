## SpecStory

## Type Assertion for DecodedMessage in TypeScript (11/13/2024, 3:12:24 PM)

_**User**_

how can i have an assert while using type DecodedMessageWithCodecsType = DecodedMessage<(TextCodec | ReactionCodec | ReadReceiptCodec | GroupUpdatedCodec | ReplyCodec | RemoteAttachmentCodec | StaticAttachmentCodec | TransactionReferenceCodec | CoinbaseMessagingPaymentCodec)[]>

---

_**Assistant**_

I'll help you create a type assertion function for your `DecodedMessageWithCodecsType`. Here's how you can modify your code:

```typescript:components/Chat/Message/V3Message.tsx
// ... existing code ...

function assertMessageType<T extends IMessageCodecs>(
  message: DecodedMessageWithCodecsType,
  type: string
): asserts message is DecodedMessage<[T]> {
  if (getMessageContentType(message.contentTypeId) !== type) {
    throw new Error(`Message is not of type ${type}`);
  }
}

// Example usage:
function handleTextMessage(message: DecodedMessageWithCodecsType) {
  assertMessageType<TextCodec>(message, 'text');
  // TypeScript now knows message is DecodedMessage<[TextCodec]>
  const content = message.content(); // This is now type-safe
}

// You can also create specific assertion functions for each type:
function assertIsTextMessage(
  message: DecodedMessageWithCodecsType
): asserts message is DecodedMessage<[TextCodec]> {
  assertMessageType<TextCodec>(message, 'text');
}

function assertIsReactionMessage(
  message: DecodedMessageWithCodecsType
): asserts message is DecodedMessage<[ReactionCodec]> {
  assertMessageType<ReactionCodec>(message, 'reaction');
}
```

This approach gives you type-safe assertions. You can use it in your switch statement like this:

```typescript:components/Chat/Message/V3Message.tsx
switch (contentType) {
  case "text":
    assertIsTextMessage(message);
    const textContent = message.content(); // Now TypeScript knows this is text content
    return (
      // ... rest of your code ...
    );
}
```

The assertion will throw an error if the message type doesn't match what you expect, and TypeScript will narrow the type within that code block. This is more type-safe than using type predicates with `is` because it will fail at runtime if the type doesn't match.

---

_**User**_

not a thhrowing assert just to verify the type...

---

_**Assistant**_

Ah, if you just want to verify the type without throwing (type guard), here's how you can modify the code:

```typescript:components/Chat/Message/V3Message.tsx
// ... existing code ...

function isMessageOfType<T extends IMessageCodecs>(
  message: DecodedMessageWithCodecsType,
  type: string
): message is DecodedMessage<[T]> {
  return getMessageContentType(message.contentTypeId) === type;
}

// Example specific type guards:
function isTextMessage(
  message: DecodedMessageWithCodecsType
): message is DecodedMessage<[TextCodec]> {
  return isMessageOfType<TextCodec>(message, 'text');
}

function isReactionMessage(
  message: DecodedMessageWithCodecsType
): message is DecodedMessage<[ReactionCodec]> {
  return isMessageOfType<ReactionCodec>(message, 'reaction');
}
```

You can then use these in your code like:

```typescript:components/Chat/Message/V3Message.tsx
if (isTextMessage(message)) {
  const content = message.content(); // TypeScript knows this is text content
}

// Or in your switch:
switch (contentType) {
  case "text":
    if (isTextMessage(message)) {
      const textContent = message.content();
      return (
        // ... rest of your code ...
      );
    }
    return null;
}
```

This approach uses TypeScript's type guards to narrow the type without throwing any runtime errors.

---



---

