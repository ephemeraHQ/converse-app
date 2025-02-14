## SpecStory

## Optimal Placement for Notification Subscriptions (2/13/2025, 2:50:52 PM)

_**User**_

I need to call subscribeToConversationsNotifications to make sure my backend knows which conversations I want to recieve notifications from. I'm debatting where in my code to call this function. I feel there are so many places... like in the conversation list screen? in the conversatsions query? having a query observer in this file listening to conversations query? And I'm sure many other places... I just don't know where would be the best place and most clean place

---

_**Assistant**_

Let me help you think through this. The best place to handle conversation notification subscriptions should follow these principles:

1. It should run whenever the conversation list changes
2. It should be centralized and maintainable
3. It should avoid duplicate subscriptions
4. It should handle cleanup properly

I recommend creating a custom hook that uses a query observer pattern. This keeps the logic centralized and reusable, while automatically staying in sync with the conversations query data.

Here's how we can implement this:

```typescript:features/notifications/hooks/use-conversation-notifications-subscription.ts
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useCurrentAccount } from "@/features/auth/hooks/use-current-account";
import { getConversationsQueryOptions } from "@/features/conversations/queries/use-conversations-query";
import { 
  subscribeToConversationsNotifications,
  unsubscribeFromConversationsNotifications 
} from "../notifications-conversations-subscriptions";
import { logger } from "@/utils/logger";

export function useConversationNotificationsSubscription() {
  const { currentAccount } = useCurrentAccount();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!currentAccount) return;

    // Set up query observer
    const unsubscribe = queryClient.getQueryCache().subscribe({
      queryKey: getConversationsQueryOptions({ account: currentAccount }).queryKey,
      onChange: (query) => {
        if (!query?.state.data) return;
        
        const conversationTopics = query.state.data.map(conv => conv.topic);

        // Subscribe to notifications for all conversations
        subscribeToConversationsNotifications({ conversationTopics })
          .catch(error => {
            logger.error(`Failed to subscribe to conversation notifications: ${error}`);
          });
      }
    });

    // Cleanup function
    return () => {
      unsubscribe();
      
      // Get the current conversations data for cleanup
      const conversations = queryClient.getQueryData(
        getConversationsQueryOptions({ account: currentAccount }).queryKey
      );
      
      if (conversations) {
        const conversationTopics = conversations.map(conv => conv.topic);
        unsubscribeFromConversationsNotifications({ conversationTopics })
          .catch(error => {
            logger.error(`Failed to unsubscribe from conversation notifications: ${error}`);
          });
      }
    };
  }, [currentAccount, queryClient]);
}
```

Then you can use this hook in your app's root component or main navigation container:

```typescript:app.tsx
// ... other imports
import { useConversationNotificationsSubscription } from "@/features/notifications/hooks/use-conversation-notifications-subscription";

export function App() {
  useConversationNotificationsSubscription();
  
  // ... rest of your App component
}
```

This approach has several benefits:

1. **Centralized**: The subscription logic is in one place and easy to maintain
2. **Automatic**: It automatically handles subscribing/unsubscribing when conversations change
3. **Efficient**: Uses React Query's cache observer instead of re-running queries
4. **Cleanup**: Properly handles cleanup when the component unmounts
5. **Error Handling**: Includes proper error logging
6. **Type Safety**: Leverages existing query options for type safety

The hook will:
- Subscribe to notifications whenever the conversations query data changes
- Handle cleanup when the component unmounts
- Only run when there's a current account
- Log any subscription errors
- Use the existing query cache instead of making new requests

This is cleaner than putting it in individual screens or queries because:
- Screens might unmount/remount, causing unnecessary subscription churn
- Putting it in queries would mix concerns and make the queries more complex
- Having it as a separate observer keeps the code more modular and focused

---

_**User**_

 i don't wnat a hook, just a function that i can call that will start listening to queryObserver

---

_**Assistant**_

I'll help you create a function that sets up the query observer for conversation notifications. This will be more flexible as you can call it wherever and whenever needed.

```typescript:features/notifications/notifications-conversations-subscriptions.ts
import { QueryClient } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { getConversationsQueryOptions } from "@/features/conversations/queries/use-conversations-query";
import { logger } from "@/utils/logger";

export function subscribeToConversationsNotifications(args: {
  conversationTopics: ConversationTopic[];
}): Promise<void> {
  // TODO: Implement the actual subscription logic
  return Promise.resolve();
}

export function unsubscribeFromConversationsNotifications(args: {
  conversationTopics: ConversationTopic[];
}): Promise<void> {
  // TODO: Implement the actual unsubscription logic
  return Promise.resolve();
}

export function setupConversationNotificationsObserver(args: { 
  queryClient: QueryClient;
  account: string;
}): () => void {
  const { queryClient, account } = args;

  // Set up query observer
  const unsubscribe = queryClient.getQueryCache().subscribe({
    queryKey: getConversationsQueryOptions({ account }).queryKey,
    onChange: (query) => {
      if (!query?.state.data) return;
      
      const conversationTopics = query.state.data.map((conv) => conv.topic);

      // Subscribe to notifications for all conversations
      subscribeToConversationsNotifications({ conversationTopics }).catch(
        (error) => {
          logger.error(
            `Failed to subscribe to conversation notifications: ${error}`
          );
        }
      );
    },
  });

  // Return cleanup function
  return () => {
    unsubscribe();
    
    // Get the current conversations data for cleanup
    const conversations = queryClient.getQueryData(
      getConversationsQueryOptions({ account }).queryKey
    );
    
    if (conversations) {
      const conversationTopics = conversations.map((conv) => conv.topic);
      unsubscribeFromConversationsNotifications({ conversationTopics }).catch(
        (error) => {
          logger.error(
            `Failed to unsubscribe from conversation notifications: ${error}`
          );
        }
      );
    }
  };
}
```

Now you can use this function wherever makes the most sense in your application. For example, you might call it when initializing your app or when a user logs in:

```typescript
// Example usage in your app initialization
const unsubscribeFromNotifications = setupConversationNotificationsObserver({
  queryClient,
  account: currentAccount,
});

// When you need to clean up (e.g., on logout)
unsubscribeFromNotifications();
```

This approach gives you more flexibility than a hook because:
1. You can call it programmatically when needed
2. You're not tied to React's component lifecycle
3. You can manage the subscription timing more precisely
4. It's easier to test and debug since it's just a pure function

The function returns a cleanup function that you should call when you want to stop observing conversations (e.g., when the user logs out).

Remember to properly type your conversations data and handle any type-related errors that the linter pointed out in the previous version. I've made the subscription/unsubscription functions return Promises to handle async operations properly.

---

_**User**_

i see here that observer has many avaialbe functions like many i shared in screenshot. What are the difference between all those? Can you look online? which one should i use in my use case

---

_**Assistant**_

Let me explain the key QueryObserver methods and help choose the right one for your case:

1. **subscribe/onChange** - What you're currently using. Triggers on any query state change (data, loading, error).

2. **getCurrentQuery** - Returns current query instance without subscribing to changes.

3. **getCurrentResult** - Returns current query result (data, status etc.) without subscribing.

4. **getOptimisticResult** - Returns what the result would be after an optimistic update.

5. **fetchOptimistic** - Executes an optimistic query update without actually fetching.

6. **refetch** - Forces a refetch of the query.

7. **setOptions** - Updates the observer options (like queryKey, enabled etc.).

For your notifications subscription use case, there are two main approaches:

1. Using `subscribe` (current approach):
```typescript
const unsubscribe = observer.subscribe((result) => {
  // Triggers on ANY change (loading, error, data)
});
```

2. Using `onQueryUpdated` (recommended):
```typescript:features/notifications/notifications-conversations-subscriptions.ts
import { getAllowedConsentConversationsQueryOptions } from "@/queries/conversations-allowed-consent-query";
import { queryClient } from "@/queries/queryClient";
import { logger } from "@/utils/logger";
import { QueryObserver } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";

export function subscribeToConversationsNotifications(args: {
  conversationTopics: ConversationTopic[];
}): Promise<void> {
  // TODO: Implement the actual subscription logic
  return Promise.resolve();
}

export function unsubscribeFromConversationsNotifications(args: {
  conversationTopics: ConversationTopic[];
}): Promise<void> {
  // TODO: Implement the actual unsubscription logic
  return Promise.resolve();
}

export function setupConversationNotificationsObserver(args: {
  account: string;
}) {
  const { account } = args;

  const observer = new QueryObserver(queryClient, {
    queryKey: getAllowedConsentConversationsQueryOptions({ account }).queryKey,
  });

  // Get initial data and subscribe
  const currentResult = observer.getCurrentResult();
  if (currentResult.data) {
    const conversationTopics = currentResult.data.map((conv) => conv.topic);
    subscribeToConversationsNotifications({ conversationTopics }).catch(
      (error) => {
        logger.error(
          `Failed to subscribe to conversation notifications: ${error}`
        );
      }
    );
  }

  // Set up query observer for future updates
  const unsubscribe = observer.onQueryUpdated((query) => {
    if (!query.state.data) return;

    const conversationTopics = query.state.data.map((conv) => conv.topic);
    
    // Subscribe to notifications for all conversations
    subscribeToConversationsNotifications({ conversationTopics }).catch(
      (error) => {
        logger.error(
          `Failed to subscribe to conversation notifications: ${error}`
        );
      }
    );
  });

  return () => {
    unsubscribe();
  };
}
```

I recommend using `onQueryUpdated` with `getCurrentResult` because:

1. `onQueryUpdated` only triggers when the query data actually changes, not on loading states
2. Using `getCurrentResult` ensures we handle the initial data immediately
3. This approach is more efficient as it avoids unnecessary subscription callbacks
4. It's cleaner to separate initial data handling from update handling

The other methods are useful for different scenarios:
- `getOptimisticResult`/`fetchOptimistic` - For optimistic updates
- `refetch` - For manual refetching
- `setOptions` - For dynamically changing query options
- `getCurrentQuery` - For accessing query instance details

But for your notification subscription use case, the combination of `getCurrentResult` for initial data and `onQueryUpdated` for changes is the most appropriate approach.

---



---

