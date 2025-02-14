## SpecStory

## Zustand with React Context Integration (12/10/2024, 10:59:58 AM)

_**User**_

is it possible to have the persisted store logic but while using zustand with react context?

---

_**Assistant**_

Yes, it's possible to combine Zustand with React Context to handle persisted stores. This approach can be useful when you want to avoid global state and ensure store instances are scoped to specific contexts. Here's how we can refactor your code:

```typescript:features/conversation/conversation-persisted-stores.ts
import { createContext, useContext, useRef, type PropsWithChildren } from 'react';
import { Nullable } from "@/types/general";
import { zustandMMKVStorage } from "@utils/mmkv";
import {
  ConversationTopic,
  MessageId,
  RemoteAttachmentContent,
} from "@xmtp/react-native-sdk";
import { createStore, useStore } from "zustand";
import { createJSONStorage, persist, subscribeWithSelector } from "zustand/middleware";

// ... keep your existing types (IComposerMediaPreviewStatus, IComposerMediaPreview, IConversationPersistedStore) ...

type IConversationStoreContext = {
  store: ReturnType<typeof createConversationStore> | null;
};

const ConversationStoreContext = createContext<IConversationStoreContext>({ store: null });

function createConversationStore(conversationTopic: ConversationTopic) {
  return createStore<IConversationPersistedStore>()(
    subscribeWithSelector(
      persist(
        (set) => ({
          inputValue: "",
          replyingToMessageId: null,
          composerMediaPreview: null,
          composerUploadedAttachment: null,
          setInputValue: (value) => set({ inputValue: value }),
        }),
        {
          storage: createJSONStorage(() => zustandMMKVStorage),
          name: `conversation_${conversationTopic}`,
          partialize: (state) => ({
            inputValue: state.inputValue,
            replyingToMessageId: state.replyingToMessageId,
            mediaPreview: state.composerMediaPreview,
            uploadedAttachment: state.composerUploadedAttachment,
          }),
        }
      )
    )
  );
}

type IConversationStoreProviderProps = PropsWithChildren<{
  conversationTopic: ConversationTopic;
}>;

export function ConversationStoreProvider(args: IConversationStoreProviderProps) {
  const { children, conversationTopic } = args;
  const storeRef = useRef(createConversationStore(conversationTopic));

  return (
    <ConversationStoreContext.Provider value={{ store: storeRef.current }}>
      {children}
    </ConversationStoreContext.Provider>
  );
}

export function useConversationPersistedStore<T>(
  selector: (state: IConversationPersistedStore) => T
) {
  const context = useContext(ConversationStoreContext);
  
  if (!context.store) {
    throw new Error('useConversationPersistedStore must be used within ConversationStoreProvider');
  }

  return useStore(context.store, selector);
}
```

To use this in your components:

```typescript:features/conversation/some-component.tsx
function ConversationComponent(args: { topic: ConversationTopic }) {
  const { topic } = args;
  
  return (
    <ConversationStoreProvider conversationTopic={topic}>
      <ConversationContent />
    </ConversationStoreProvider>
  );
}

function ConversationContent() {
  const inputValue = useConversationPersistedStore((state) => state.inputValue);
  const setInputValue = useConversationPersistedStore((state) => state.setInputValue);
  
  return (
    // ... your component JSX
  );
}
```

Key changes and benefits of this approach:

1. Each conversation now has its own store instance managed through React Context
2. The store is created once per conversation and persisted in a ref
3. No need for a global Map to store conversation instances
4. Better encapsulation as the store is only available to components within the provider
5. Still maintains persistence through MMKV storage
6. Type safety is preserved throughout

The main tradeoff is that you'll need to wrap your conversation components with the provider, but this is generally a good practice for component isolation anyway.

---

_**User**_

There's no way to make this work right? because that would mean the sotre is accessible outside of react which we can't do?

useCurrentConversationPersistedStoreState

---

_**Assistant**_

Ah, you've hit on an important point! You're correct - if we need to access the store outside of React (like in `useCurrentConversationPersistedStoreState`), the Context-based approach won't work because Context is only accessible within the React component tree.

For functions that need to access the store outside of React components (like event handlers, background tasks, or utility functions), we need to keep the Map-based approach. Here's a hybrid solution:

```typescript:features/conversation/conversation-persisted-stores.ts
// ... keep existing types and imports ...

// Keep the Map for

---

_**User**_

this i mean sorry:

export function getCurrentConversationPersistedStore() {
  const topic = useConversationStore.getState().topic;
  return getConversationPersistedStore(topic);
}

---

_**Assistant**_

Ah yes, you're exactly right! The `getCurrentConversationPersistedStore` function that uses `useConversationStore.getState()` wouldn't work with the Context approach because:

1. Context is only accessible within React components via `useContext`
2. We can't access the store instance outside of the React component tree
3. `getState()` is a direct store access that needs the store to be globally available

This is one of the main advantages of the Map-based approach - it allows us to access the store state from anywhere in the application, even outside React components. If we need this functionality, we should stick with the Map-based implementation you currently have.

The Context-based approach would be more "React-like" and provide better encapsulation, but it sacrifices the ability to access the store outside of React components, which seems to be a requirement in your case.

---



---

