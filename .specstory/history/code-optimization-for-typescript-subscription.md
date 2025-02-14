## SpecStory

## Code Optimization for TypeScript Subscription (1/8/2025, 8:40:09 AM)

_**User**_

make it shorter

---

_**Assistant**_

Based on the code style guide and ADR, here's how we can make the `accountTopicSubscription.ts` code more concise while maintaining functionality:

````typescript:features/notifications/utils/accountTopicSubscription.ts
// ... imports stay the same ...

const accountTopicUnsubscribeMap: Record<string, () => void> = {};

export const setupAccountTopicSubscription = (account: string) => {
  if (accountTopicUnsubscribeMap[account]) {
    logger.info(`[setupAccountTopicSubscription] already subscribed to ${account}`);
    return accountTopicUnsubscribeMap[account];
  }

  const observer = createConversationListQueryObserver({ account, context: "sync" });
  let previous: number | undefined;

  const unsubscribe = observer.subscribe((conversationList) => {
    if (!conversationList.data || conversationList.dataUpdatedAt === previous) return;
    
    previous = conversationList.dataUpdatedAt;
    subscribeToNotifications({ conversations: conversationList.data, account });
    resetNotifications();
  });

  accountTopicUnsubscribeMap[account] = unsubscribe;
  return unsubscribe;
};

// ... unsubscribeFromAccountTopicSubscription stays the same ...
````

Key changes:
1. Simplified logging message
2. Used early return pattern in the subscribe callback
3. Removed redundant logging and comments
4. Cleaned up formatting for better readability

The core functionality remains identical while making the code more concise and aligned with the style guide.

---



---

