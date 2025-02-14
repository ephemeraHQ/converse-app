## SpecStory

## Type Compatibility Error in TypeScript Code (11/13/2024, 2:27:08 PM)

_**User**_

For the code present, we get this error:
```
A type predicate's type must be assignable to its parameter's type.
  Type 'DecodedMessage<TextCodec[]>' is not assignable to type 'DecodedMessage<ISingleCodec>'.
    The types returned by 'client.conversations.list()' are incompatible between these types.
      Type 'Promise<Conversation<TextCodec[]>[]>' is not assignable to type 'Promise<Conversation<ISingleCodec>[]>'.
        Type 'Conversation<TextCodec[]>[]' is not assignable to type 'Conversation<ISingleCodec>[]'.
          Type 'Conversation<TextCodec[]>' is not assignable to type 'Conversation<ISingleCodec>'.
            Type 'TextCodec[]' is not assignable to type 'ISingleCodec'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error occurs because the type predicate's return type `DecodedMessage<TextCodec[]>` doesn't match the parameter type's union structure. Here's the fix:

```typescript:components/Chat/Message/V3Message.tsx
// ... existing code ...

type ISingleCodec = [TextCodec] | [ReactionCodec] | [ReadReceiptCodec] | [GroupUpdatedCodec] | [ReplyCodec]

function isTextMessage(message: DecodedMessage<ISingleCodec>): message is DecodedMessage<[TextCodec]> {
  return getMessageContentType(message.contentTypeId) === 'text';
}
```

The key change is in the return type predicate: `message is DecodedMessage<[TextCodec]>` instead of `DecodedMessage<TextCodec[]>`. This matches the tuple structure defined in `ISingleCodec`.

---



---

