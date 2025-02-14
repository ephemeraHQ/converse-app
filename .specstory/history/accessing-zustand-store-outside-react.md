## SpecStory

## Accessing Zustand Store Outside React (12/9/2024, 3:18:41 PM)

_**User**_

if i'm using zustand as a context is there still a way to get the store outside of React?

---

_**Assistant**_

Yes! When using Zustand with context, you can still access the store outside of React components by storing a reference to the store instance. Here's how we can modify your code to enable this:

```typescript:features/conversation/conversation-store.tsx
// ... existing imports ...

// Add a Map to store conversation stores by topic
const conversationStores = new Map<string, IConversationStore>();

const createConversationStore = (initProps: IConversationStoreProps) => {
  const store = createStore<IConversationStoreState>()(
    subscribeWithSelector((set) => ({
      uploadedRemoteAttachment: null,
      messageContextMenuData: null,
      pickingEmojiForMessageId: null,
      ...initProps,
    }))
  );
  
  // Store the reference in our Map using the topic as key
  conversationStores.set(initProps.topic, store);
  return store;
};

// Add a function to get store outside of React
export function getConversationStore(topic: string): IConversationStore {
  const store = conversationStores.get(topic);
  if (!store) {
    throw new Error(`No conversation store found for topic: ${topic}`);
  }
  return store;
}

// ... rest of the code remains the same ...
```

Now you can use the store outside of React components like this:

```typescript
// In any file:
import { getConversationStore } from './conversation-store';

// Get the store instance
const store = getConversationStore('your-topic');

// Get current state
const state = store.getState();

// Update state
store.setState({ uploadedRemoteAttachment: newAttachment });

// Subscribe to changes
const unsubscribe = store.subscribe(
  (state) => state.uploadedRemoteAttachment,
  (attachment) => {
    console.log('Attachment changed:', attachment);
  }
);
```

This approach maintains the benefits of using context for React components while also allowing direct store access when needed outside of React. Just make sure the store has been created (via the Provider being mounted) before trying to access it outside of React.

---



---

