## SpecStory

## Fixing GET Request Data Handling (1/15/2025, 2:26:30 PM)

_**User**_

how can i pass body data?

---

_**Assistant**_

There's an error in the `getTopics` function. In axios (which I assume `api` is using), for GET requests, we should use `params` instead of `body`. The data should be passed as URL query parameters. Here's the fix:

```typescript:utils/api/topics.ts
export async function getTopics(args: { account: string }) {
  logger.debug(`[API TOPICS] getTopics for account: ${args.account}`);
  const { account } = args;

  const { data } = await api.get(`/api/topics`, {
    headers: await getXmtpApiHeaders(account),
    params: { topics }, // Changed from body to params
  });

  // ... rest of the function
}
```

Key changes:
1. Changed `body` to `params` since GET requests cannot have a body
2. The data will now be sent as query parameters in the URL

Also, I notice that `topics` is undefined in the current code. You might need to add it as a parameter to the function if you need to pass specific topics:

```typescript:utils/api/topics.ts
export async function getTopics(args: { account: string; topics?: string[] }) {
  logger.debug(`[API TOPICS] getTopics for account: ${args.account}`);
  const { account, topics } = args;

  const { data } = await api.get(`/api/topics`, {
    headers: await getXmtpApiHeaders(account),
    params: topics ? { topics } : undefined,
  });

  // ... rest of the function
}
```

---



---

