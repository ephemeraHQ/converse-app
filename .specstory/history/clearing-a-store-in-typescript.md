## SpecStory

## Clearing a Store in TypeScript (1/8/2025, 11:44:07 AM)

_**User**_

how can i erase a store

---

_**Assistant**_

To erase/clear a store, we'll need to add a clear action to the store and expose it. Here's how to modify the code:

```typescript:features/conversation-list/stores/conversation-list.store.tsx
// ... existing code ...

type StoreState = {
  pinnedConversationTopics: ConversationTopic[];
  actions: {
    setPinnedConversationTopics: (topics: ConversationTopic[]) => void;
    clearStore: () => void;  // Add clear action type
  };
};

function createConversationListStore(inboxId: InboxId) {
  return create<StoreState>()(
    persist(
      (set) => ({
        pinnedConversationTopics: [],
        actions: {
          setPinnedConversationTopics: (topics) =>
            set({ pinnedConversationTopics: topics }),
          clearStore: () => set({ pinnedConversationTopics: [] }),  // Add clear implementation
        },
      }),
      {
        name: `conversation-list-${inboxId}`,
        storage: createJSONStorage(() => AsyncStorage),
      }
    )
  );
}

// ... existing code ...

// Add a utility function to clear a specific store
export function clearConversationListStore(inboxId: InboxId) {
  stores[inboxId]?.getState().actions.clearStore();
  delete stores[inboxId]; // Remove store instance from stores object
}
```

This adds two ways to clear the store:

1. Using the store's actions: `store.getState().actions.clearStore()`
2. Using the new utility function: `clearConversationListStore(inboxId)`

The `clearStore` action will reset the store to its initial state, and `clearConversationListStore` will both clear the data and remove the store instance from the stores cache.

You can use it like this:
```typescript
// Using actions
const { clearStore } = useConversationListStoreActions();
clearStore();

// Or using utility function
clearConversationListStore(inboxId);
```

---



---

