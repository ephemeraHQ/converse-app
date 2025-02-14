## SpecStory

## Zustand Store with Account-Specific Persistence (1/8/2025, 10:49:03 AM)

_**User**_

I want a zustand store but no context but I want to make sure we have persistance with pinnedConvetsationTopics and make sure we have 1 store for each account



---

_**Assistant**_

I'll help you create a zustand store with persistence for pinned conversations that's account-specific. We'll use zustand's persist middleware and include the account address in the storage key.

```typescript:features/conversation-list/stores/conversation-list.store.tsx
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ConversationTopic } from '@xmtp/react-native-sdk'

type StoreState = {
  pinnedConversationTopics: ConversationTopic[]
  setPinnedConversationTopics: (topics: ConversationTopic[]) => void
}

function createConversationListStore(accountAddress: string) {
  return create<StoreState>()(
    persist(
      (set) => ({
        pinnedConversationTopics: [],
        setPinnedConversationTopics: (topics) => 
          set({ pinnedConversationTopics: topics }),
      }),
      {
        name: `conversation-list-${accountAddress}`,
        storage: createJSONStorage(() => AsyncStorage),
      }
    )
  )
}

const stores: Record<string, ReturnType<typeof createConversationListStore>> = {}

export function useConversationListStore(accountAddress: string) {
  if (!stores[accountAddress]) {
    stores[accountAddress] = createConversationListStore(accountAddress)
  }
  return stores[accountAddress]
}
```

Key changes made:
1. Added persistence using zustand's `persist` middleware with AsyncStorage
2. Created a store factory function that includes the account address in the storage key
3. Added a cache object (`stores`) to maintain one store instance per account
4. Modified the hook to create/return the appropriate store based on account address

Now you can use it like this:
```typescript
const { pinnedConversationTopics } = useConversationListStore(accountAddress)
```

This approach:
- Creates separate persistent storage for each account
- Maintains singleton stores per account
- Removes the need for React Context
- Persists data between app restarts
- Follows the functional programming patterns from your style guide

---



---

