## SpecStory

## TypeScript Message Content Codec Definition (12/3/2024, 4:08:55 PM)

_**User**_

I just want one but now it seems an array type MessageContentWithCodecsType = NativeContentCodec<(TextCodec | ReactionCodec | ReadReceiptCodec | GroupUpdatedCodec | ReplyCodec | RemoteAttachmentCodec | StaticAttachmentCodec | TransactionReferenceCodec | CoinbaseMessagingPaymentCodec)[]>

---

_**Assistant**_

To modify the `MessageContentWithCodecsType` to be an array type, you can update the type definition to include an array of the specific codecs. Here's how you can do it:

```typescript:utils/xmtpRN/client.ts
export type MessageContentWithCodecsType =
  NativeContentCodec<(TextCodec | ReactionCodec | ReadReceiptCodec | GroupUpdatedCodec | ReplyCodec | RemoteAttachmentCodec | StaticAttachmentCodec | TransactionReferenceCodec | CoinbaseMessagingPaymentCodec)[]>;
```

### Explanation:
- The `NativeContentCodec` is now parameterized with a union of all the codec types wrapped in an array `[]`, indicating that it can handle an array of these codec types.

---



---

