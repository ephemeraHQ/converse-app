## SpecStory

## Refactoring Promise.allSettled Usage (2/5/2025, 7:01:12 PM)

_**User**_

ok don't use promise.allSettled but something else

---

_**Assistant**_

Based on the style guide and the request to avoid Promise.allSettled, I'll modify the code to use Promise.all with proper error handling. Here's the updated version:

```typescript:components/StateHandlers/HydrationStateHandler.tsx
// ... existing code ...

      // Critical queries
      try {
        await Promise.all(
          // We need the inboxId for each account since we use them so much
          accounts.map(async (account) => {
            try {
              await ensureInboxId({ account });
            } catch (error) {
              captureError({
                ...error,
                message: `[Hydration] Failed to get inboxId for account ${account}, removing account. ${error.message}`,
              });
              useAccountsStore.getState().removeAccount(account);
            }
          })
        );
      } catch (error) {
        logger.debug(`[Hydration] Error during inboxId initialization: ${error.message}`);
      }

// ... existing code ...
```

Key changes made:
1. Replaced `Promise.allSettled` with `Promise.all`
2. Moved error handling inside the map function to handle failures for individual accounts
3. Added a try-catch around the entire `Promise.all` for safety
4. Simplified the error handling logic while maintaining the same functionality
5. Added logging for overall initialization errors

The code will still remove accounts that fail to get an inboxId, but now uses a more straightforward error handling approach.

---



---

