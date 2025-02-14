## SpecStory

## Codec Map Type Fix Discussion (11/13/2024, 3:15:26 PM)

_**User**_

not working, fix 

---

_**Assistant**_

Let me help you fix the codec map type. The issue is with the type definition syntax. Here's the corrected version:

```typescript:components/Chat/Message/V3Message.tsx
type ICodecMap = {
  text: TextCodec;
  reaction: ReactionCodec;
  readReceipt: ReadReceiptCodec;
  groupUpdated: GroupUpdatedCodec;
  reply: ReplyCodec;
  remoteAttachment: RemoteAttachmentCodec;
  attachment: StaticAttachmentCodec;
  transactionReference: TransactionReferenceCodec;
  coinbasePayment: CoinbaseMessagingPaymentCodec;
};
```

The changes made:
1. Removed the complex type inference attempt with `DecodedMessageWithCodecsType`
2. Simplified to a direct mapping of string literals to codec types
3. Removed the unnecessary `[key: string]` index signature
4. Fixed the syntax by removing quotes around keys and semicolons after values

This provides a clean type mapping between content type strings and their corresponding codec types, which you can use for type checking and inference throughout your message handling code.

---



---

