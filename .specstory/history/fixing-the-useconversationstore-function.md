## SpecStory

## Fixing the useConversationStore Function (11/19/2024, 9:14:41 AM)

_**User**_

fix

---

_**Assistant**_

To fix the `useConversationStore` function, we need to ensure that it correctly uses the `zustand` store's `useStore` hook to select the state. Here's the updated code:

```typescript:features/conversation/conversation-stores.ts
// ... existing code ...

import { useStore } from 'zustand';

// ... existing code ...

export function useConversationStore<T>(
  conversationId: string,
  selector: (state: IConversationStore) => T
) {
  const store = getConversationStore(conversationId);
  return useStore(store, selector);
}

// ... existing code ...
```

### Explanation:
- **Import `useStore`:** We import the `useStore` hook from `zustand` to properly select the state from the store.
- **Use `useStore`:** The `useStore` hook is used to access the state of the store with the provided `selector` function. This ensures that the component using this hook will re-render when the selected state changes.

---



---

