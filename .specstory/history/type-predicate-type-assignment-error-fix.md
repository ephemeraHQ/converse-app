## SpecStory

## Type Predicate Type Assignment Error Fix (11/13/2024, 2:22:24 PM)

_**User**_

For the code present, we get this error:
```
A type predicate's type must be assignable to its parameter's type.
  Type 'DecodedMessage<[TextCodec]>' is not assignable to type 'DecodedMessage<(TextCodec | ReactionCodec | ReadReceiptCodec | GroupUpdatedCodec | ReplyCodec | RemoteAttachmentCodec | StaticAttachmentCodec | TransactionReferenceCodec | CoinbaseMessagingPaymentCodec)[]>'.
    The types returned by 'client.conversations.list()' are incompatible between these types.
      Type 'Promise<Conversation<[TextCodec]>[]>' is not assignable to type 'Promise<Conversation<(TextCodec | ReactionCodec | ReadReceiptCodec | GroupUpdatedCodec | ReplyCodec | RemoteAttachmentCodec | StaticAttachmentCodec | TransactionReferenceCodec | CoinbaseMessagingPaymentCodec)[]>[]>'.
        Type 'Conversation<[TextCodec]>[]' is not assignable to type 'Conversation<(TextCodec | ReactionCodec | ReadReceiptCodec | GroupUpdatedCodec | ReplyCodec | RemoteAttachmentCodec | StaticAttachmentCodec | TransactionReferenceCodec | CoinbaseMessagingPaymentCodec)[]>[]'.
          Type 'Conversation<[TextCodec]>' is not assignable to type 'Conversation<(TextCodec | ReactionCodec | ReadReceiptCodec | GroupUpdatedCodec | ReplyCodec | RemoteAttachmentCodec | StaticAttachmentCodec | TransactionReferenceCodec | CoinbaseMessagingPaymentCodec)[]>'.
            Type '(TextCodec | ReactionCodec | ReadReceiptCodec | GroupUpdatedCodec | ReplyCodec | RemoteAttachmentCodec | StaticAttachmentCodec | TransactionReferenceCodec | CoinbaseMessagingPaymentCodec)[]' is not assignable to type '[TextCodec]'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error occurs because the type predicate is too specific. We need to adjust it to work with the array of possible codec types. Here's the fix:

```typescript:components/Chat/Message/V3Message.tsx
// ... existing code ...

type IMessageCodecs = TextCodec | ReactionCodec | ReadReceiptCodec | GroupUpdatedCodec | ReplyCodec | 
  RemoteAttachmentCodec | StaticAttachmentCodec | TransactionReferenceCodec | CoinbaseMessagingPaymentCodec;

function isTextMessage(message: DecodedMessageWithCodecsType): message is DecodedMessage<IMessageCodecs[]> {
  return getMessageContentType(message.contentTypeId) === 'text';
}
```

The key change is modifying the return type to `DecodedMessage<IMessageCodecs[]>` instead of `DecodedMessage<[TextCodec]>`. This allows the type predicate to work with the array of possible codec types while still checking if the message is specifically a text message.

---



---

