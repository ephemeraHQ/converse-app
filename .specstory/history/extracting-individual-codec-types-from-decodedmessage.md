## SpecStory

## Extracting Individual Codec Types from DecodedMessage (11/13/2024, 3:11:02 PM)

_**User**_

if type DecodedMessageWithCodecsType = DecodedMessage<(TextCodec | ReactionCodec | ReadReceiptCodec | GroupUpdatedCodec | ReplyCodec | RemoteAttachmentCodec | StaticAttachmentCodec | TransactionReferenceCodec | CoinbaseMessagingPaymentCodec)[]>

can i extract every single type

---

_**Assistant**_

I'll help you extract individual types for each codec from the `DecodedMessageWithCodecsType`. Here's how we can define them:

```typescript:utils/xmtpRN/types.ts
import {
  DecodedMessage,
  TextCodec,
  ReactionCodec,
  ReadReceiptCodec,
  GroupUpdatedCodec,
  ReplyCodec,
  RemoteAttachmentCodec,
  StaticAttachmentCodec,
} from "@xmtp/react-native-sdk";
import { TransactionReferenceCodec } from "@xmtp/content-type-transaction-reference";
import { CoinbaseMessagingPaymentCodec } from "./contentTypes/coinbasePayment";

export type ITextMessage = DecodedMessage<TextCodec>;
export type IReactionMessage = DecodedMessage<ReactionCodec>;
export type IReadReceiptMessage = DecodedMessage<ReadReceiptCodec>;
export type IGroupUpdatedMessage = DecodedMessage<GroupUpdatedCodec>;
export type IReplyMessage = DecodedMessage<ReplyCodec>;
export type IRemoteAttachmentMessage = DecodedMessage<RemoteAttachmentCodec>;
export type IStaticAttachmentMessage = DecodedMessage<StaticAttachmentCodec>;
export type ITransactionReferenceMessage = DecodedMessage<TransactionReferenceCodec>;
export type ICoinbasePaymentMessage = DecodedMessage<CoinbaseMessagingPaymentCodec>;

// Union type of all message types
export type IAnyDecodedMessage = 
  | ITextMessage 
  | IReactionMessage 
  | IReadReceiptMessage 
  | IGroupUpdatedMessage 
  | IReplyMessage 
  | IRemoteAttachmentMessage 
  | IStaticAttachmentMessage 
  | ITransactionReferenceMessage 
  | ICoinbasePaymentMessage;
```

This creates individual types for each codec message type, following your naming convention of prefixing with 'I'. I also included a union type `IAnyDecodedMessage` that combines all message types, which can be useful when you need to handle any type of message.

You can then use these types to type-check specific message handling:

```typescript
function handleTextMessage(message: ITextMessage) {
  // Handle text message
}

function handleReaction(message: IReactionMessage) {
  // Handle reaction
}

// etc...
```

When you need to determine the type of a message at runtime, you can use the `contentType` property:

```typescript
function handleMessage(message: IAnyDecodedMessage) {
  if (message.contentType.sameAs(new TextCodec().contentType)) {
    // This is a text message
    const textMessage = message as ITextMessage;
    // Handle text message
  }
  // ... handle other types
}
```

---



---

