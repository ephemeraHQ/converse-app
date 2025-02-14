## SpecStory

## Type Error Resolution for Conversation Object (11/27/2024, 9:26:24 AM)

_**User**_

For the code present, we get this error:
```
Argument of type '() => { topic: string; client: {}; id: string; createdAt: Date; version: "1.0"; }' is not assignable to parameter of type 'Updater<ConversationWithCodecsType | undefined, ConversationWithCodecsType | undefined>'.
  Type '() => { topic: string; client: {}; id: string; createdAt: Date; version: "1.0"; }' is not assignable to type '(input: ConversationWithCodecsType | undefined) => ConversationWithCodecsType | undefined'.
    Type '{ topic: string; client: {}; id: string; createdAt: Date; version: "1.0"; }' is not assignable to type 'ConversationWithCodecsType | undefined'.
      Type '{ topic: string; client: {}; id: string; createdAt: Date; version: "1.0"; }' is not assignable to type 'Group<(TextCodec | ReactionCodec | ReadReceiptCodec | GroupUpdatedCodec | ReplyCodec | RemoteAttachmentCodec | StaticAttachmentCodec | TransactionReferenceCodec | CoinbaseMessagingPaymentCodec)[]> | Dm<...>'.
        Type '{ topic: string; client: {}; id: string; createdAt: Date; version: "1.0"; }' is missing the following properties from type 'Dm<(TextCodec | ReactionCodec | ReadReceiptCodec | GroupUpdatedCodec | ReplyCodec | RemoteAttachmentCodec | StaticAttachmentCodec | TransactionReferenceCodec | CoinbaseMessagingPaymentCodec)[]>': state, peerInboxId, send, prepareMessage, and 8 more.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error you're encountering is due to the fact that the object you're returning does not satisfy the `ConversationWithCodecsType` type. Specifically, it lacks several required properties such as `state`, `peerInboxId`, `send`, `prepareMessage`, and others.

To resolve this, you need to ensure that the object you return in the `setQueryData` function matches the `ConversationWithCodecsType` type. Here's a concise fix:

```typescript:features/conversation/dm-conversation.screen.tsx
          client: {}, // Add appropriate client object
          id: "RANDOM_ID", // Add a valid ID
          createdAt: new Date(), // Add a valid date
          version: "1.0", // Add a valid version
          state: "active", // Add a valid state
          peerInboxId: "RANDOM_PEER_INBOX_ID", // Add a valid peerInboxId
          send: async () => {}, // Add a valid send function
          prepareMessage: async () => {}, // Add a valid prepareMessage function
          // Add other required properties here
```

### Explanation:
- **State and peerInboxId**: These are placeholders and should be replaced with actual values that make sense in your application's context.
- **send and prepareMessage**: These are functions that need to be implemented according to your application's logic.

Ensure that all required properties of `ConversationWithCodecsType` are provided. You may need to refer to the type definition to ensure all necessary fields are included.

---



---

