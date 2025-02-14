## SpecStory

## Improving Notification Reset Logic (1/28/2025, 2:35:43 PM)

_**User**_

not sure why we would have this? like when we have a new conversationList update it resets sub??

---

_**Assistant**_

I understand your confusion. The current implementation seems to reset notifications whenever there's a new conversation list update, which isn't ideal. This was likely intended to handle new messages but is doing so too broadly.

Let me suggest a more focused approach that only resets notifications when necessary:

```typescript:features/notifications/utils/accountTopicSubscription.ts
// ... existing code ...

export const setupAccountTopicSubscription = (account: string) => {
  if (accountTopicUnsubscribeMap[account]) {
    logger.info(
      `[setupAccountTopicSubscription] already subscribed to account ${account}`
    );
    return accountTopicUnsubscribeMap[account];
  }

  logger.info(
    `[setupAccountTopicSubscription] subscribing to account ${account}`
  );

  const observer = createConversationsQueryObserver({
    account,
    caller: "setupAccountTopicSubscription",
  });

  let previousConversations = new Set<string>();
  const unsubscribe = observer.subscribe((result) => {
    if (!result.data) return;

    // Only process if this is for the current active account
    if (account !== currentAccount()) return;

    // Get current conversation IDs
    const currentConversations = new Set(
      result.data.map((conv) => conv.id)
    );

    // Only reset notifications if we have new conversations
    if (currentConversations.size > previousConversations.size) {
      logger.debug(`[setupAccountTopicSubscription] New conversations detected, resetting notifications`);
      resetNotifications(account);
    }

    previousConversations = currentConversations;
  });

  accountTopicUnsubscribeMap[account] = unsubscribe;
  return unsubscribe;
};
```

Key changes made:
1. Added early returns to prevent unnecessary processing
2. Only reset notifications when new conversations are detected, rather than on every data update
3. Track conversation IDs instead of just the update timestamp
4. Added more descriptive logging

This change makes the subscription more purposeful - it will only reset notifications when new conversations are actually added, rather than on any data update. This should prevent unnecessary notification resets while still maintaining the desired functionality of handling new conversations.

Let me know if you'd like me to explain any part of this change in more detail!

---



---

