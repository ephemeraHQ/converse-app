## SpecStory

## Data Fetching and Caching Assurance (2/3/2025, 11:14:43 AM)

_**User**_

just to be sure. if we don't have data, we'll fetch it and wait until it finishes right?

---

_**Assistant**_

Yes, that's correct! `ensureQueryData` is a method that will:

1. First check if the data exists in the cache
2. If it doesn't exist or is stale, it will fetch the data
3. It returns a Promise that will resolve only after the data is available (either from cache or from a fresh fetch)

This makes it perfect for scenarios where you absolutely need the data before proceeding. It's like a combination of `getQueryData` and `fetchQuery` with a guarantee that you'll get the data (or an error if the fetch fails).

Here's a quick example of how it works:

```typescript
// If data exists in cache -> returns immediately with cached data
// If no data -> fetches and waits for the result
const inboxId = await ensureInboxId({ account: "0x123..." });
// At this point, you're guaranteed to have the inboxId (or the function would have thrown)
```

This is different from `getQueryData` which would just return `undefined` if the data isn't in the cache, or `prefetchQuery` which fetches the data but doesn't wait for it to complete.

---



---

