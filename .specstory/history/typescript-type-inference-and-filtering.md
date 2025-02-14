## SpecStory

## TypeScript Type Inference and Filtering (1/20/2025, 9:07:27 PM)

_**User**_

why spamResults infer this type spamResults: {
    conversation: Conversation<SupportedCodecsType> | undefined;
    isSpam: boolean;
}[]

I have filter !!r.conversation

---

_**Assistant**_

The type inference issue occurs because TypeScript's type narrowing through the filter doesn't automatically narrow the type of `conversation` from `Conversation | undefined` to just `Conversation`. Even though we're using `!!r.conversation` in the filter, TypeScript maintains the possibility of `undefined` in the type.

Here's how we can fix this by adding a type predicate:

```typescript:features/conversation-requests-list/use-conversation-requests-list-items.tsx
// ... existing code ...

  const spamResults = spamQueries
    .map((q, i) => ({
      conversation: unkownConsentConversations?.[i],
      isSpam: q.data ?? true,
    }))
    .filter((r): r is { conversation: NonNullable<typeof r.conversation>, isSpam: boolean } => 
      !!r.conversation
    );

// ... existing code ...
```

This change adds a type predicate to the filter callback that tells TypeScript that any item passing the filter will have a non-null `conversation` property. The `NonNullable` utility type removes `undefined` from the type.

Now `spamResults` will be correctly typed as:
```typescript
{
    conversation: Conversation<SupportedCodecsType>;
    isSpam: boolean;
}[]
```

---



---

