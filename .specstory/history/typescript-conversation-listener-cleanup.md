## SpecStory

## TypeScript Conversation Listener Cleanup (1/28/2025, 3:17:38 PM)

_**User**_

how can we make this cleaner?

---

_**Assistant**_

I'll help you clean up the `listenForNewConversations` function and its related code. Here are the main improvements:

1. Use TypeScript types instead of `any`
2. Add proper cleanup for listeners
3. Make the code more functional
4. Improve variable naming
5. Add better type safety

Here's the cleaned up version:

```typescript:features/streams/streams.ts
// ... existing code ...

type IConversationListener = ReturnType<typeof createConversationsQueryObserver>['subscribe'];
type IConversationListeners = Record<string, IConversationListener>;

// Store conversation state
const conversationState = {
  previous: [] as ConversationWithCodecsType[],
  listeners: {} as IConversationListeners,
};

// This is a temporary workaround related to https://github.com/xmtp/xmtp-react-native/issues/560
async function listenForNewConversations({ account }: { account: string }) {
  // Cleanup existing listener if any
  cleanupConversationListener(account);

  const observer = createConversationsQueryObserver({
    account,
    caller: "streams",
  });

  const listener = observer.subscribe(({ data: conversations }) => {
    if (!conversations) return;

    const newConversations = findNewConversations(conversations);
    
    if (newConversations.length > 0) {
      logger.debug(
        `[Streaming] Found ${newConversations.length} new conversations`
      );
    }

    stopStreaming([account]);
    conversationState.previous = conversations;
  });

  conversationState.listeners[account] = listener;
}

function findNewConversations(currentConversations: ConversationWithCodecsType[]) {
  return currentConversations.filter(
    (conversation) =>
      !conversationState.previous.some((prev) => prev.topic === conversation.topic)
  );
}

function cleanupConversationListener(account: string) {
  const existingListener = conversationState.listeners[account];
  if (existingListener) {
    existingListener();
    delete conversationState.listeners[account];
  }
}

// Add this to your cleanup logic (e.g., in stopStreaming)
function cleanupAllConversationListeners() {
  Object.keys(conversationState.listeners).forEach(cleanupConversationListener);
  conversationState.previous = [];
}

// ... existing code ...
```

Key improvements made:

1. Added proper TypeScript types for the listeners using `ReturnType` to infer the correct type
2. Created a single `conversationState` object to manage related state
3. Extracted the new conversation detection logic into a separate function
4. Added proper cleanup functions for individual and all listeners
5. Improved variable naming for clarity
6. Added type safety with proper TypeScript types
7. Removed unnecessary destructuring
8. Added cleanup functionality to prevent memory leaks

You should also update your `stopStreaming` function to include the cleanup:

```typescript:features/streams/streams.ts
async function stopStreaming(accounts: string[]) {
  const store = useStreamingStore.getState();

  await Promise.all(
    accounts.map(async (account) => {
      try {
        await Promise.all([
          stopStreamingAllMessage({ ethAddress: account }),
          stopStreamingConversations({ ethAddress: account }),
          stopStreamingConsent(account),
        ]);
      } finally {
        cleanupConversationListener(account);
        store.actions.resetAccount(account);
      }
    })
  );
}
```

These changes make the code more maintainable, type-safe, and prevent potential memory leaks by properly cleaning up listeners.

---



---

