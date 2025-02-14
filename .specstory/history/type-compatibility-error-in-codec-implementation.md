## SpecStory

## Type Compatibility Error in Codec Implementation (11/13/2024, 2:19:57 PM)

_**User**_

For the code present, we get this error:
```
A type predicate's type must be assignable to its parameter's type.
  Type 'DecodedMessage<TextCodec>' is not assignable to type 'DecodedMessage<IMessageCodecs[]>'.
    The types returned by 'client.conversations.list()' are incompatible between these types.
      Type 'Promise<Conversation<TextCodec>[]>' is not assignable to type 'Promise<Conversation<IMessageCodecs[]>[]>'.
        Type 'Conversation<TextCodec>[]' is not assignable to type 'Conversation<IMessageCodecs[]>[]'.
          Type 'Conversation<TextCodec>' is not assignable to type 'Conversation<IMessageCodecs[]>'.
            Type 'TextCodec' is not assignable to type 'IMessageCodecs[]'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error occurs because we're mixing single codec types with codec arrays. Here's the fix:

```typescript:components/Chat/Message/V3Message.tsx
// ... existing code ...

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

// Update type guard to use single codec instead of array
function isTextMessage(message: DecodedMessage<IMessageCodecs>): message is DecodedMessage<TextCodec> {
  return getMessageContentType(message.contentTypeId) === 'text';
}

function isReactionMessage(message: DecodedMessage<IMessageCodecs>): message is DecodedMessage<ReactionCodec> {
  return getMessageContentType(message.contentTypeId) === 'reaction';
}
```

The key changes:
1. Removed the array notation `IMessageCodecs[]` from the parameter type
2. Changed to use single codec types in both the parameter and return type

This aligns the types properly since we're checking for individual codec types, not arrays of codecs.

---



---

