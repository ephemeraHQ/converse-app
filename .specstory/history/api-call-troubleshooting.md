## SpecStory

## API Call Troubleshooting (1/16/2025, 3:34:07 PM)

_**User**_

anything wrong with my api.get? I do it on the browser it works i do it here it dones't work... like my Backend doesn't even get called

---

_**Assistant**_

Ah, I see the issue. When using `axios.get()` (which I assume your `api` is based on), the `data` parameter should be passed as URL parameters using `params` instead of `data`. The `data` property is typically used for POST/PUT requests.

Here's how to fix it:

```typescript:utils/api/topics.ts
// ... existing code ...
export async function getTopics(args: {
  account: string;
  topics: ConversationTopic[];
}) {
  logger.debug(`[API TOPICS] getTopics for account: ${args.account}`);
  const { account, topics } = args;

  const { data } = await api.get(`/api/topics`, {
    headers: await getXmtpApiHeaders(account),
    params: { topics }, // Changed from data to params
  });

  // ... rest of the function
}
// ... existing code ...
```

The issue is that:
- For GET requests, data should be sent as query parameters using `params`
- Using `data` in a GET request might not properly serialize the parameters in the URL
- This is why it works in the browser (where you might be using different tooling) but not in this context

You should make the same change in `getAllTopics` if you plan to add parameters there in the future.

---

_**User**_

but params will be passed in query no? 

---

_**Assistant**_

Yes, exactly - params will be passed in the query string of the URL. If you need to send data in the request body instead, you should use POST rather than GET. This is because:

1. GET requests technically shouldn't have a request body according to HTTP specifications
2. Some servers and middleware might ignore or strip the body from GET requests
3. GET requests with a body are controversial and not well-supported across all platforms

If you need to send the topics in the request body, you should change the method to POST:

```typescript:utils/api/topics.ts
export async function getTopics(args: {
  account: string;
  topics: ConversationTopic[];
}) {
  logger.debug(`[API TOPICS] getTopics for account: ${args.account}`);
  const { account, topics } = args;

  const { data } = await api.post(`/api/topics`, 
    { topics }, // Request body
    { headers: await getXmtpApiHeaders(account) }
  );

  // ... rest of the function
}
```

Choose based on your backend API requirements:
- If your backend expects the topics in the query string, use GET with `params`
- If your backend expects the topics in the request body, use POST with the data as the second argument

---

_**User**_

how long can the query params be? what If I have a list of 20 string

---

_**Assistant**_



Query parameter length limits can be problematic because:

1. Different browsers/servers have different URL length limits:
   - IE: 2,083 characters
   - Chrome: ~32,000 characters
   - Safari: ~80,000 characters
   - Server-side limits vary (Apache default is 8,192 bytes)

2. Long URLs can cause issues with:
   - Proxies
   - Firewalls
   - Caching systems
   - URL encoding (making the actual URL even longer)

For your case with a list of 20 strings, it's definitely better to use POST since:
1. You're sending a structured data array
2. The data could be large
3. You don't need the caching benefits of GET
4. POST has no practical limit on body size

Here's the recommended approach:

```typescript:utils/api/topics.ts
export async function getTopics(args: {
  account: string;
  topics: ConversationTopic[];
}) {
  logger.debug(`[API TOPICS] getTopics for account: ${args.account}`);
  const { account, topics } = args;

  const { data } = await api.post(`/api/topics/list`, // Consider renaming endpoint to be more RESTful
    { topics },
    { headers: await getXmtpApiHeaders(account) }
  );

  // ... rest of the function
}
```

This is a more reliable approach for sending lists of data, especially when you don't know the potential size of the list.

---

_**User**_

For the code present, we get this error:
```
Type '{ isDeleted: boolean; isPinned: boolean; markedAsUnread: boolean; readUntil?: number | undefined; timestamp?: number | undefined; status?: "unread" | "read" | "deleted" | null | undefined; } | null | undefined' is not assignable to type 'Partial<{ isDeleted: boolean; isPinned: boolean; markedAsUnread: boolean; readUntil?: number | undefined; timestamp?: number | undefined; status?: "unread" | "read" | "deleted" | null | undefined; } | null>'.
  Type 'undefined' is not assignable to type 'Partial<{ isDeleted: boolean; isPinned: boolean; markedAsUnread: boolean; readUntil?: number | undefined; timestamp?: number | undefined; status?: "unread" | "read" | "deleted" | null | undefined; } | null>'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The issue is with the type mismatch in the `onError` callback. Here's the fix:

```typescript:features/conversation/hooks/use-mark-conversation-as-read.ts
// ... existing code ...
onError: (error, _, context) => {
  const currentAccount = getCurrentAccount()!;
  updateConversationMetadataQueryData({
    account: currentAccount,
    topic,
    updateData: context?.previousData ?? null, // Add null fallback
  });
},
// ... existing code ...
```

This ensures `updateData` always receives either the previous data or `null`, never `undefined`.

---



---

