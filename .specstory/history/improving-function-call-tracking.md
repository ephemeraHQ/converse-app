## SpecStory

## Improving Function Call Tracking (1/16/2025, 2:23:49 PM)

_**User**_

is there a better way than adding "contexT" every where to know like who called the function?

---

_**Assistant**_

Yes! Instead of passing `context` everywhere, a better practice would be to use error tracking or logging with stack traces. Here's how we can improve the code:

```typescript:queries/conversations-query.ts
// ... existing code ...

const getConversations = async (args: { account: string }) => {
  const { account } = args;

  // Use Error.captureStackTrace() to get the caller information
  const stackTrace = {};
  Error.captureStackTrace(stackTrace);
  logger.debug(
    `[ConversationsQuery] Fetching conversations from network. Caller: ${stackTrace.stack?.split('\n')[2]}`
  );

  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  // ... rest of the function
};

export const getConversationsQueryOptions = (args: IArgs) => {
  const { account } = args;
  return queryOptions({
    queryKey: conversationsQueryKey(account),
    queryFn: () => getConversations({ account }),
    enabled: !!account,
    refetchOnMount: true,
  });
};

// Remove context from other functions like updateConversationInConversationsQueryData, etc.
```

This approach has several benefits:
1. Cleaner function signatures without the extra `context` parameter
2. Automatic capture of where the function was called from
3. More detailed debugging information when needed
4. No need to manually pass context strings around

The stack trace will show you the exact file and line number where the function was called from, which is more useful than manually passed context strings.

If you're using a logging service like Sentry, it will automatically capture this information for you as well, making it even easier to track down issues in production.

---



---

