## SpecStory

## Setting Timeout for React Query Function (2/6/2025, 10:00:37 PM)

_**User**_

with react-query how cna i set a timeout to the queryFn?

---

_**Assistant**_

I'll help you add a timeout to the query function in your code. There are two common approaches to handle this - either using React Query's built-in timeout option or implementing a timeout wrapper for the fetch function.

Let's implement both options, and you can choose which one works better for your use case:

1. Using React Query's built-in timeout:

```typescript:queries/useInboxProfileSocialsQuery.ts
// ... existing imports ...

export const getInboxProfileSocialsQueryConfig = ({
  inboxId,
  caller,
}: Optional<IArgsWithCaller, "caller">) =>
  queryOptions({
    queryKey: getProfileSocialsQueryKey({ inboxId }),
    queryFn: () => fetchInboxProfileSocials({ inboxId }),
    enabled: !!inboxId,
    // Add timeout option (in milliseconds)
    timeout: 10000, // 10 seconds timeout
    gcTime: 1000 * 60 * 60 * 24 * 30,
    meta: {
      caller,
    },
  });
```

2. Alternative approach - implementing a timeout wrapper for more control:

```typescript:queries/useInboxProfileSocialsQuery.ts
// ... existing imports ...

// Add this utility function at the top of the file
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Query timeout")), timeoutMs)
    ),
  ]);
}

const fetchInboxProfileSocials = async ({ inboxId }: IArgs) => {
  if (!inboxId) {
    throw new Error("Inbox ID is required");
  }
  // Wrap the fetch call with timeout
  return withTimeout(inboxProfileSocialsBatchFetcher.fetch(inboxId), 10000); // 10 seconds timeout
};
```

Both approaches will add a 10-second timeout to your query. Here are the key differences:

1. The first approach using React Query's `timeout` option is simpler but less flexible.
2. The second approach gives you more control over the timeout behavior and error message.

Choose the first approach if you want a simple solution and are happy with React Query's default timeout behavior. Choose the second approach if you need more control over the timeout implementation or want to customize the error handling.

Note that if you're dealing with a slow API, make sure to set an appropriate timeout value that balances between user experience and giving enough time for the request to complete.

---

_**User**_



---

_**Assistant**_

I've implemented both approaches for adding a timeout to your query function:

1. Added React Query's built-in `timeout` option (10 seconds) in the query config
2. Added a `withTimeout` utility function that wraps the fetch call

The changes include:

1. Added the `withTimeout` utility function:
```typescript
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Query timeout")), timeoutMs)
    ),
  ]);
}
```

2. Modified the fetch function to use the timeout wrapper:
```typescript
const fetchInboxProfileSocials = async ({ inboxId }: IArgs) => {
  if (!inboxId) {
    throw new Error("Inbox ID is required");
  }
  return withTimeout(inboxProfileSocialsBatchFetcher.fetch(inboxId), 10000);
};
```

3. Added the timeout option to the query config:
```typescript
export const getInboxProfileSocialsQueryConfig = ({
  inboxId,
  caller,
}: Optional<IArgsWithCaller, "caller">) =>
  queryOptions({
    // ...
    timeout: 10000,
    // ...
  });
```

This implementation gives you double protection against hanging requests:
1. The `withTimeout` wrapper will reject the promise after 10 seconds
2. React Query's built-in timeout will also cancel the query after 10 seconds

If you want to use only one approach, you can remove either the `withTimeout` wrapper or the `timeout` option in the query config. The `withTimeout` approach gives you more control over the error message and behavior.

---



---

