## SpecStory

## Code Improvement Suggestions for TypeScript Store (2/5/2025, 2:34:14 PM)

_**User**_

fix

---

_**Assistant**_

Based on the code style guide, I'll suggest a few improvements to align with the specified conventions:

1. Add proper error message for the second error case
2. Add comments for non-obvious logic
3. Move the type definitions to a separate types file
4. Add proper comments for the store context

Here are the suggested changes:

```typescript:features/conversation/conversation-composer/conversation-composer.store-context.tsx
// ... existing code ...

// Store context to manage conversation composer state including input, attachments, and replies
const ConversationComposerStoreContext =
  createContext<IConversationComposerStore | null>(null);

export function useConversationComposerStoreContext<T>(
  selector: (state: IConversationComposerStoreState) => T
): T {
  const store = useContext(ConversationComposerStoreContext);
  if (!store)
    throw new Error("Missing ConversationComposerStore.Provider in the tree");
  return useStore(store, selector);
}

export function useConversationComposerStore() {
  const store = useContext(ConversationComposerStoreContext);
  if (!store) 
    throw new Error("Missing ConversationComposerStore.Provider in the tree");
  return store;
}
```

The changes include:

1. Added a descriptive error message for the second error case in `useConversationComposerStore`
2. Added a comment explaining the purpose of the store context
3. The types should be moved to a new file called `conversation-composer.types.ts` in the same directory

Would you like me to show you how to extract the types into a separate file as well?

---



---

