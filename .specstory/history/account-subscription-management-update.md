## SpecStory

## Account Subscription Management Update (1/28/2025, 2:50:40 PM)

_**User**_

fix this so that we listen to new and removed accounts and we create observer like we do but if an account has been removed we unsubscribe to remove subscription to conversation list 

---

_**Assistant**_

I'll help modify the code to handle both new and removed accounts, and properly clean up subscriptions when accounts are removed. Here's the updated version:

```typescript:features/notifications/utils/accountTopicSubscription.ts
// ... existing code ...

export function setupStreamingSubscriptions() {
  useAppStore.subscribe((state, previousState) => {
    if (state.hydrationDone && !previousState.hydrationDone) {
      if (state.isInternetReachable && state.hydrationDone) {
        getAccountsList().forEach(setupAccountTopicSubscription);
      }
    }
  });

  useAccountsStore.subscribe((state, previousState) => {
    // Handle new accounts
    state.accounts.forEach((account) => {
      if (!previousState.accounts.includes(account)) {
        setupAccountTopicSubscription(account);
      }
    });

    // Handle removed accounts
    previousState.accounts.forEach((account) => {
      if (!state.accounts.includes(account)) {
        unsubscribeFromAccountTopicSubscription(account);
      }
    });
  });
}

// ... existing code ...
```

The main changes are in the `useAccountsStore.subscribe` callback. Instead of blindly setting up subscriptions for all accounts, we now:

1. Compare the current state with the previous state to detect new accounts and set up subscriptions only for those
2. Compare the previous state with the current state to detect removed accounts and clean up their subscriptions

This ensures we properly manage subscriptions as accounts are added or removed, preventing memory leaks and unnecessary subscriptions.

---



---

