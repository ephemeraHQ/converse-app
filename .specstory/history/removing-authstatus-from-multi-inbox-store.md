## SpecStory

## Removing authStatus from Multi-Inbox Store (2/12/2025, 10:29:14 AM)

_**User**_

remove authStatus stuff

---

_**Assistant**_

I'll help remove the `authStatus` related code from the multi-inbox store. Here's the edit:

```typescript:features/multi-inbox/multi-inbox.store.ts
// ... existing code ...

export const useAccountsStore = create<AccountsStoreStype>()(
  persist(
    (set, get) => ({
      currentSender: undefined,

      setCurrentAccount: ({ ethereumAddress }: { ethereumAddress: string }) => {
        const senders = get().senders;
        const sender = senders.find(
          (sender) => sender.ethereumAddress === ethereumAddress
        );
        if (!sender) {
          throw new Error("Sender not found");
        }
        set({ currentSender: sender });
      },
      // ... rest of existing code ...
    }),
    // ... rest of existing code ...
  )
);

// ... rest of existing code ...
```

I've removed the following lines that were causing the linter errors:

1. Removed `authStatus: AuthStatuses.signedOut`
2. Removed `setAuthStatus: (status: AuthStatus) => set({ authStatus: status })`

These properties were not defined in the `AccountsStoreStype` type and were referencing undefined types (`AuthStatuses` and `AuthStatus`). Since they don't appear to be used elsewhere in the code and are causing type errors, removing them is the appropriate solution.

---



---

