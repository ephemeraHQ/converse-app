## SpecStory

## Fixing Type Guard for Text Message Detection (11/13/2024, 3:09:56 PM)

_**User**_

fix the message is ... 

 type DecodedMessageWithCodecsType = DecodedMessage<(TextCodec | ReactionCodec | ReadReceiptCodec | GroupUpdatedCodec | ReplyCodec | RemoteAttachmentCodec | StaticAttachmentCodec | TransactionReferenceCodec | CoinbaseMessagingPaymentCodec)[]>

---

_**Assistant**_

I'll help fix the type guard for `isTextMessage`. The issue is that we need to handle the union type correctly. Here's the corrected version:

```typescript:components/Chat/Message/V3Message.tsx
function isTextMessage(
  message: DecodedMessageWithCodecsType
): message is DecodedMessage<[TextCodec]> {
  const contentType = getMessageContentType(message.contentTypeId);
  return contentType === "text" && message.contentTypeId === TextCodec.contentType;
}
```

The changes:
1. Added a more specific check using both `getMessageContentType` and direct comparison with `TextCodec.contentType`
2. This ensures we're properly narrowing the type to specifically `DecodedMessage<[TextCodec]>`

This type guard will now correctly identify text messages while maintaining type safety with the broader `DecodedMessageWithCodecsType` union type.

---



---

