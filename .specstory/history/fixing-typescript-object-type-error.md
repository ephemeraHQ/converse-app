## SpecStory

## Fixing TypeScript Object Type Error (11/27/2024, 2:45:43 PM)

_**User**_

For the code present, we get this error:
```
Argument of type '{ state: "allowed"; }' is not assignable to parameter of type 'ConversationWithCodecsType'.
  Type '{ state: "allowed"; }' is missing the following properties from type 'Dm<(TextCodec | ReactionCodec | ReadReceiptCodec | GroupUpdatedCodec | ReplyCodec | RemoteAttachmentCodec | StaticAttachmentCodec | TransactionReferenceCodec | CoinbaseMessagingPaymentCodec)[]>': client, id, createdAt, version, and 12 more.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error you're encountering is due to the fact that the object you're passing to `setConversationQueryData` is missing required properties defined in the `ConversationWithCodecsType`. To resolve this, you need to ensure that all required properties are included in the object.

Here's a concise fix for the issue:

```typescript:hooks/useGroupConsent.ts
          setConversationQueryData(account, topic, {
            ...previousConversation,
            state: "allowed",
            // Ensure all required properties are included
            client: previousConversation.client,
            id: previousConversation.id,
            createdAt: previousConversation.createdAt,
            version: previousConversation.version,
            // Add other required properties here
          });
```

### Explanation:
- The error message indicates that the object is missing several properties required by `ConversationWithCodecsType`.
- By spreading `previousConversation`, you include all existing properties, and then you explicitly set the `state` to `"allowed"`.
- Ensure that all required properties from `ConversationWithCodecsType` are included in the object. If there are additional properties required, make sure to add them as well.

---



---

