## SpecStory

## Extracting Group Type from Union in TypeScript (12/17/2024, 9:37:54 AM)

_**User**_

if the type is infered like this: type ConversationQueryData = Group<SupportedCodecsType> | Dm<SupportedCodecsType>

Possible to extract only the Group<SupportedCodecsType> ?

---

_**Assistant**_

Yes, you can extract just the `Group` type using TypeScript's conditional types. Here's how to modify the type definition:

```typescript:queries/useConversationQuery.ts
// ... existing code ...
export type ConversationQueryData = Awaited<ReturnType<typeof getConversation>>;
export type GroupConversationData = Extract<ConversationQueryData, Group<SupportedCodecsType>>;
// ... existing code ...
```

The `Extract` utility type will get only the `Group` part from the union type. This is useful when you want to work specifically with group conversations.

You could then use it like this when you specifically need the Group type:

```typescript
function handleGroupConversation(conversation: GroupConversationData) {
  // TypeScript now knows this is definitely a Group conversation
  // You have access to Group-specific properties
}
```

This is safer than using type assertions because TypeScript will ensure at compile time that you're working with the correct type.

---



---

