## SpecStory

## Improving Context Usage in Code (12/9/2024, 11:22:18 AM)

_**User**_

i 'm doing this right now to use the context

 const isAllowedConversation = useConversationContext(
      "isAllowedConversation"
    );
    const conversationId = useConversationContext("conversationId");


But is there a cleaner way? 

---

_**Assistant**_

Yes, you can destructure the values you need from the context in a single call to `useConversationContext`. This approach is cleaner and more efficient:

```typescript:features/conversation/conversation-context.tsx
const { isAllowedConversation, conversationId } = useConversationContext();
```

To support this, you need to modify the `useConversationContext` function to return the entire context value instead of a single key. Here's how you can update the function:

```typescript:features/conversation/conversation-context.tsx
export const useConversationContext = () => {
  return useContextSelector(ConversationContext, (context) => context);
};
```

With this change, you can destructure any values you need from the context in a single line, making your code cleaner and more readable.

---

_**User**_

But will it still make my context performant? 

---

_**Assistant**_

Yes, using `useContextSelector` with the entire context object can still be performant, but it depends on how you manage updates within the context.

The `useContextSelector` library is designed to optimize context usage by allowing you to select only the parts of the context you need, which minimizes unnecessary re-renders. However, if you return the entire context object, any change to any part of the context will cause all components using that context to re-render.

To maintain performance, consider the following strategies:

1. **Split Contexts**: If your context contains multiple independent values that change at different times, consider splitting them into separate contexts. This way, only the components that depend on a specific part of the context will re-render when that part changes.

2. **Memoization**: Use `useMemo` to memoize values within the context provider to prevent unnecessary updates.

3. **Selective Updates**: If you need to keep a single context, ensure that updates to the context are as selective as possible. Only update the parts of the context that have changed.

Here's an example of how you might split contexts:

```typescript
// Separate context for conversation state
const ConversationStateContext = createContext<{
  isAllowedConversation: boolean;
  isBlockedConversation: boolean;
} | null>(null);

// Separate context for conversation ID
const ConversationIdContext = createContext<ConversationId | null>(null);

// Usage in a component
const { isAllowedConversation } = useContextSelector(ConversationStateContext, (context) => context!);
const conversationId = useContextSelector(ConversationIdContext, (id) => id);
```

By splitting contexts, you can ensure that only the components that depend on a specific part of the context will re-render when that part changes, thus maintaining performance.

---



---

