## SpecStory

## Dynamic Codec Replacement in TypeScript (11/13/2024, 3:14:59 PM)

_**User**_

can i replace ImessageCodes with something dynamic from type DecodedMessageWithCodecsType = DecodedMessage<(TextCodec | ReactionCodec | ReadReceiptCodec | GroupUpdatedCodec | ReplyCodec | RemoteAttachmentCodec | StaticAttachmentCodec | TransactionReferenceCodec | CoinbaseMessagingPaymentCodec)[]>

---

_**Assistant**_

Yes! We can extract the codec types from `DecodedMessageWithCodecsType`. Here's how to update the code:

```typescript:components/Chat/Message/V3Message.tsx
// ... existing code ...

type ICodecMap = {
  [key: string]: DecodedMessageWithCodecsType extends DecodedMessage<(infer T)[]> ? T : never;
};

// ... existing code ...
```

This change uses TypeScript's `infer` keyword to extract the union type of codecs from the array type in `DecodedMessageWithCodecsType`. The resulting type will be exactly what we want - the union of all possible codec types.

This approach is more maintainable because it automatically stays in sync with `DecodedMessageWithCodecsType` - if new codec types are added or removed, `ICodecMap` will automatically update to match.

---



---

