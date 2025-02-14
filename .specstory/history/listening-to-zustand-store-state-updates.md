## SpecStory

## Listening to Zustand Store State Updates (1/8/2025, 11:19:33 AM)

_**User**_

how can I listen to a specific store state update?

---

_**Assistant**_

I'll show you how to subscribe to specific state updates in your Zustand store. Here's how you can add a subscription method:

```typescript:features/conversation-list/stores/conversation-list.store.tsx
// ... existing imports ...

type StoreState = {
  pinnedConversationTopics: ConversationTopic[];
  setPinnedConversationTopics: (topics: ConversationTopic[]) => void;
};

function createConversationListStore(inboxId: InboxId) {
  const store = create<StoreState>()(
    persist(
      (set) => ({
        pinnedConversationTopics: [],
        setPinnedConversationTopics: (topics) =>
          set({ pinnedConversationTopics: topics }),
      }),
      {
        name: `conversation-list-${inboxId}`,
        storage: createJSONStorage(() => AsyncStorage),
      }
    )
  );

  // Add subscription method
  store.subscribe((state, prevState) => {
    // This will run on every state change
    if (state.pinnedConversationTopics !== prevState.pinnedConversationTopics) {
      // This will only run when pinnedConversationTopics changes
      console.log('Pinned conversations updated:', state.pinnedConversationTopics);
    }
  });

  return store;
}

// ... rest of the code ...
```

You can use it in your components in two ways:

1. Using the subscribe method directly:
```typescript
useEffect(() => {
  const unsubscribe = useConversationListStore(inboxId).subscribe(
    (state, prevState) => {
      if (state.pinnedConversationTopics !== prevState.pinnedConversationTopics) {
        // Handle state change
      }
    }
  );
  
  return () => unsubscribe();
}, [inboxId]);
```

2. Using a selector to listen to specific state changes:
```typescript
const pinnedTopics = useConversationListStore(inboxId).subscribe(
  (state) => state.pinnedConversationTopics
);
```

The second approach with selectors is generally preferred as it's more React-friendly and will automatically handle cleanup when the component unmounts. The first approach with manual subscription is useful when you need more control or want to perform side effects outside of React components.

---



---

