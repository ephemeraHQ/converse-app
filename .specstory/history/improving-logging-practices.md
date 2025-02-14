## SpecStory

## Improving Logging Practices (1/31/2025, 1:28:05 PM)

_**User**_

what could be better log? but I want to keep ti short..

---

_**Assistant**_

Based on the style guide's logging preferences and keeping it concise, here's a better version:

```typescript:queries/queryClient.ts
// ... existing code ...
      logger.debug(
        `Query success [${query.queryKey.join('/')}]${
          query.meta?.caller ? ` (${query.meta.caller})` : ''
        }`
      );
// ... existing code ...
```

The improvements are:
1. Use `join('/')` instead of `JSON.stringify` to make the query key more readable
2. Put the query key in square brackets for better visual separation
3. Use parentheses for the caller instead of spelling out "from caller"
4. Reordered to put "Query success" first for better readability

This will produce logs like:
- `Query success [conversations/123]`
- `Query success [messages/456] (MessageList)`

---



---

