## SpecStory

## Dynamic Store Creation Based on Topic (2/5/2025, 2:29:43 PM)

_**User**_

ok i ahve this composer store, but what i want to do is when the topic change in @conversation.store-context.tsx i want the store to change and create a new store if that makes snense. Because the storeName should be based of the conversation store topic

---

_**Assistant**_

I'll help you modify the `ConversationComposerStoreProvider` to create a new store when the topic changes. Here's how we can update the code:

```typescript:features/conversation/conversation-composer/conversation-composer.store-context.tsx
// ... existing code ...

export const ConversationComposerStoreProvider = memo(
  ({ children, ...props }: IConversationComposerStoreProviderProps) => {
    const storeRef = useRef<IConversationComposerStore>();
    const topic = useCurrentConversationTopic();
    
    // Create a new store when topic changes
    if (!storeRef.current || (topic && props.storeName !== `composer-${topic}`)) {
      storeRef.current = createConversationComposerStore({
        ...props,
        storeName: topic ? `composer-${topic}` : props.storeName,
      });
    }

    return (
      <ConversationComposerStoreContext.Provider value={storeRef.current}>
        {children}
      </ConversationComposerStoreContext.Provider>
    );
  }
);

// ... existing code ...
```

The key changes are:

1. Added `useCurrentConversationTopic()` hook to get the current topic
2. Modified the store creation condition to create a new store when either:
   - No store exists yet, or
   - The topic has changed (by comparing the current storeName with what it should be based on the topic)
3. The storeName is now dynamically generated based on the topic when available

This way, each conversation will have its own persisted composer state based on its topic. When switching between conversations, a new store will be created (or loaded from storage) for that specific conversation.

Make sure to add the import at the top:

```typescript
import { useCurrentConversationTopic } from "@/features/conversation/conversation.store-context";
```

---



---

