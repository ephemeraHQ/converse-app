## SpecStory

## Resolving TypeScript Codec Error (11/13/2024, 2:21:04 PM)

_**User**_

For the code present, we get this error:
```
Type 'IMessageCodecs' does not satisfy the constraint 'DefaultContentTypes'.
  Type 'TextCodec' is missing the following properties from type 'ContentCodec<any>[]': length, pop, push, concat, and 35 more.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error occurs because `DecodedMessage` expects an array of codecs, not a single codec. Here's the fix:

```typescript:components/Chat/Message/V3Message.tsx
// ... existing code ...

type IMessageCodecs = [
  TextCodec | 
  ReactionCodec | 
  ReadReceiptCodec | 
  GroupUpdatedCodec | 
  ReplyCodec | 
  RemoteAttachmentCodec | 
  StaticAttachmentCodec | 
  TransactionReferenceCodec | 
  CoinbaseMessagingPaymentCodec
];

function isTextMessage(message: DecodedMessage<IMessageCodecs>): message is DecodedMessage<[TextCodec]> {
  return getMessageContentType(message.contentTypeId) === 'text';
}
```

The key changes are:
1. Wrapping the union type in square brackets `[]` to make it a tuple type
2. Using `[TextCodec]` instead of `TextCodec` in the return type

This satisfies the `ContentCodec<any>[]` constraint that `DecodedMessage` expects.

---



---

