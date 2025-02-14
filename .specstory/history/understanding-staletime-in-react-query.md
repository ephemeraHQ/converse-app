## SpecStory

## Understanding staleTime in React Query (2/5/2025, 2:39:02 PM)

_**User**_

what is a good staleTime

---

_**Assistant**_

Let me help explain staleTime in React Query and suggest appropriate values.

StaleTime determines how long data remains "fresh" before React Query considers it stale and triggers a background refetch. The right staleTime depends on how frequently your data changes:

Here's a general guide for staleTime values:

1. For frequently changing data (e.g., real-time chat, live feeds):
   - 0 to 30 seconds (0 - 30_000 ms)

2. For semi-dynamic data (e.g., user profiles, settings):
   - 30 seconds to 5 minutes (30_000 - 300_000 ms)

3. For relatively static data (e.g., configuration data, reference lists):
   - 5 minutes to 1 hour (300_000 - 3_600_000 ms)

4. For very static data (e.g., documentation, static content):
   - 1 hour or more (3_600_000+ ms)

For your constants file, I would suggest defining multiple stale times based on data types:

```typescript:queries/queryClient.constants.ts
// ... existing code ...

// For real-time/frequently changing data
export const REALTIME_STALE_TIME = 0;

// For semi-dynamic data
export const SHORT_STALE_TIME = 1000 * 30; // 30 seconds

// For relatively static data
export const MEDIUM_STALE_TIME = 1000 * 60 * 5; // 5 minutes

// For very static data (current default)
export const DEFAULT_STALE_TIME = 1000 * 60 * 60; // 1 hour
// ... existing code ...
```

This gives you more flexibility to choose the appropriate staleTime based on the specific data requirements of each query. You can then import and use these constants as needed in your query configurations.

Remember that staleTime is different from cacheTime (gcTime in v5) - staleTime affects when data is considered stale and triggers background refetches, while cacheTime determines how long inactive data remains in the cache before being garbage collected.

---



---

