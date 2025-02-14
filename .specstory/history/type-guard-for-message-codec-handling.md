## SpecStory

## Type Guard for Message Codec Handling (11/13/2024, 2:17:07 PM)

_**User**_

ok each message has this type

const messages: DecodedMessage<(TextCodec | ReactionCodec | ReadReceiptCodec | GroupUpdatedCodec | ReplyCodec | RemoteAttachmentCodec | StaticAttachmentCodec | TransactionReferenceCodec | CoinbaseMessagingPaymentCodec)[]>

What i want is to be able to do like if(messageIsText){ // HERE THE TYPE OF THE MESSAGE WILL BE TextCodec because messageIsText is a assertion function}

---

_**Assistant**_

I'll help you create a type guard function that will narrow down the message type based on the codec. Here's how we can modify the code:

```typescript:components/Chat/Message/V3Message.tsx
// ... existing code ...

// First, let's define our codec types more precisely
type IMessageCodecs = 
  | TextCodec 
  | ReactionCodec 
  | ReadReceiptCodec 
  | GroupUpdatedCodec 
  | ReplyCodec 
  | RemoteAttachmentCodec 
  | StaticAttachmentCodec 
  | TransactionReferenceCodec 
  | CoinbaseMessagingPaymentCodec;

// Type guard functions for each message type
function isTextMessage(message: DecodedMessage<IMessageCodecs[]>): message is DecodedMessage<[TextCodec]> {
  return getMessageContentType(message.contentTypeId) === 'text';
}

function isReactionMessage(message: DecodedMessage<IMessageCodecs[]>): message is DecodedMessage<[ReactionCodec]> {
  return getMessageContentType(message.contentTypeId) === 'reaction';
}

// Usage example in your switch statement:
if (isTextMessage(message)) {
  // Here TypeScript knows that message is DecodedMessage<[TextCodec]>
  const textContent = message.content();
  return (
    // ... your JSX
  );
}
```

This approach gives you:
1. Type safety with proper narrowing
2. Runtime type checking
3. Autocomplete for the specific codec type properties

You can create similar type guards for each message type you need to handle. When you use these guards in if statements or switch cases, TypeScript will properly narrow the type of the message within that scope.

---



---

