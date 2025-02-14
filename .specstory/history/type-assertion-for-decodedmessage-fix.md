## SpecStory

## Type Assertion for DecodedMessage Fix (11/13/2024, 3:39:22 PM)

_**User**_

fix this so that it assert that the message is DecodedMessage<TextCodec[]>

const message: DecodedMessage<(TextCodec | ReactionCodec | ReadReceiptCodec | GroupUpdatedCodec | ReplyCodec | RemoteAttachmentCodec | StaticAttachmentCodec | TransactionReferenceCodec | CoinbaseMessagingPaymentCodec)[]> 

---

_**Assistant**_

Here's how to fix the type assertion for `isTextMessage` to properly narrow the type:

```typescript:components/Chat/Message/V3Message.tsx
function isTextMessage(
  message: DecodedMessage<IMessageCodecs[]>
): message is DecodedMessage<[TextCodec]> {
  return getMessageContentType(message.contentTypeId) === "text";
}
```

The key changes are:
1. Input type is now explicitly `DecodedMessage<IMessageCodecs[]>` instead of `any`
2. Return type assertion uses `[TextCodec]` instead of `TextCodec[]` since XMTP messages have exactly one codec
3. Using the existing `IMessageCodecs` type union that was already defined in the file

This will properly narrow the type when used in type guards and give you better type safety throughout the codebase.

---



---

