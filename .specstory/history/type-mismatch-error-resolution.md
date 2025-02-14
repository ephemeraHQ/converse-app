## SpecStory

## Type Mismatch Error Resolution (11/27/2024, 9:27:59 AM)

_**User**_

For the code present, we get this error:
```
Argument of type '(conversations: V3ConversationListType | undefined) => { topic: string; }[]' is not assignable to parameter of type 'Updater<V3ConversationListType | undefined, V3ConversationListType | undefined>'.
  Type '(conversations: V3ConversationListType | undefined) => { topic: string; }[]' is not assignable to type '(input: V3ConversationListType | undefined) => V3ConversationListType | undefined'.
    Type '{ topic: string; }[]' is not assignable to type 'ConversationWithCodecsType[]'.
      Type '{ topic: string; }' is not assignable to type 'ConversationWithCodecsType'.
        Type '{ topic: string; }' is missing the following properties from type 'Dm<(TextCodec | ReactionCodec | ReadReceiptCodec | GroupUpdatedCodec | ReplyCodec | RemoteAttachmentCodec | StaticAttachmentCodec | TransactionReferenceCodec | CoinbaseMessagingPaymentCodec)[]>': client, id, createdAt, version, and 12 more.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error you're encountering is due to a type mismatch. The function you're using to update the query data is returning an array of objects with only a `topic` property, but the expected type is `ConversationWithCodecsType`, which requires additional properties.

To resolve this, you need to ensure that the `newConversation` object you are adding to the list has all the required properties of `ConversationWithCodecsType`. Here's a concise fix:

```typescript:features/conversation/dm-conversation.screen.tsx
        conversationsQueryKey(currentAccount),
        (conversations) => [
          ...(conversations || []),
          {
            ...newConversation,
            // Add any missing properties here
            client: newConversation.client || defaultClient,
            id: newConversation.id || generateId(),
            createdAt: newConversation.createdAt || new Date(),
            version: newConversation.version || defaultVersion,
            // Add other required properties as needed
          } satisfies ConversationWithCodecsType
        ]
      );
```

### Explanation:
- **Spread Operator**: The spread operator `...` is used to include all existing properties of `newConversation`.
- **Default Values**: For any missing properties, you can provide default values or functions to generate them (e.g., `generateId()`).
- **Type Assertion**: The `satisfies` keyword ensures that the object conforms to the `ConversationWithCodecsType`.

Make sure to replace `defaultClient`, `generateId()`, `defaultVersion`, and any other placeholders with actual implementations or values that make sense in your context.

---



---

