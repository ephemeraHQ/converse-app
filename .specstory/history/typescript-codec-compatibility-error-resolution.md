## SpecStory

## TypeScript Codec Compatibility Error Resolution (11/21/2024, 3:24:14 PM)

_**User**_

For the code present, we get this error:
```
Argument of type 'DecodedMessage<[ReplyCodec]> | undefined' is not assignable to parameter of type 'DecodedMessageWithCodecsType | undefined'.
  Type 'DecodedMessage<[ReplyCodec]>' is not assignable to type 'DecodedMessage<(ReplyCodec | TextCodec | ReactionCodec | ReadReceiptCodec | GroupUpdatedCodec | RemoteAttachmentCodec | StaticAttachmentCodec | TransactionReferenceCodec | CoinbaseMessagingPaymentCodec)[]>'.
    The types returned by 'client.conversations.newConversation(...)' are incompatible between these types.
      Type 'Promise<Conversation<[ReplyCodec]>>' is not assignable to type 'Promise<Conversation<(ReplyCodec | TextCodec | ReactionCodec | ReadReceiptCodec | GroupUpdatedCodec | RemoteAttachmentCodec | StaticAttachmentCodec | TransactionReferenceCodec | CoinbaseMessagingPaymentCodec)[]>>'.
        Type 'Conversation<[ReplyCodec]>' is not assignable to type 'Conversation<(ReplyCodec | TextCodec | ReactionCodec | ReadReceiptCodec | GroupUpdatedCodec | RemoteAttachmentCodec | StaticAttachmentCodec | TransactionReferenceCodec | CoinbaseMessagingPaymentCodec)[]>'.
          Type 'Group<[ReplyCodec]>' is not assignable to type 'Conversation<(ReplyCodec | TextCodec | ReactionCodec | ReadReceiptCodec | GroupUpdatedCodec | RemoteAttachmentCodec | StaticAttachmentCodec | TransactionReferenceCodec | CoinbaseMessagingPaymentCodec)[]>'.
            Type 'Group<[ReplyCodec]>' is not assignable to type 'Group<(ReplyCodec | TextCodec | ReactionCodec | ReadReceiptCodec | GroupUpdatedCodec | RemoteAttachmentCodec | StaticAttachmentCodec | TransactionReferenceCodec | CoinbaseMessagingPaymentCodec)[]>'.
              Type '(ReplyCodec | TextCodec | ReactionCodec | ReadReceiptCodec | GroupUpdatedCodec | RemoteAttachmentCodec | StaticAttachmentCodec | TransactionReferenceCodec | CoinbaseMessagingPaymentCodec)[]' is not assignable to type '[ReplyCodec]'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error you're encountering is due to a type mismatch between `DecodedMessage<[ReplyCodec]>` and `DecodedMessageWithCodecsType`. The `DecodedMessageWithCodecsType` expects

---



---

