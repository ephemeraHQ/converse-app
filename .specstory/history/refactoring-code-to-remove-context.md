## SpecStory

## Refactoring Code to Remove Context (1/16/2025, 2:24:48 PM)

_**User**_

remove context stuff

---

_**Assistant**_

I'll help remove the context-related code and parameters. Here are the necessary changes:

```typescript:queries/conversations-query.ts
// ... existing code ...

const getConversations = async (args: { account: string }) => {
  const { account } = args;

  logger.debug("[ConversationsQuery] Fetching conversations from network");

  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;

  const beforeSync = new Date().getTime();

  // Always include sync for now because we'll have react-query persist anyway to give us the local conversations
  await client.conversations.sync();
  await client.conversations.syncAllConversations("allowed");

  const afterSync = new Date().getTime();

  logger.debug(
    `[ConversationsQuery] Fetching conversations from network took ${
      (afterSync - beforeSync) / 1000
    } sec`
  );

  // ... rest of function remains the same ...
};

export const getConversationsQueryOptions = (args: IArgs) => {
  const { account } = args;
  return queryOptions({
    queryKey: conversationsQueryKey(account),
    queryFn: () => getConversations({ account }),
    enabled: !!account,
    refetchOnMount: true, // Just for now because conversations are very important and we want to make sure we have all of them
  });
};

// ... existing code ...

export const addConversationToConversationsQuery = (args: {
  account: string;
  conversation: ConversationWithCodecsType;
}) => {
  const { account, conversation } = args;
  logger.debug(
    `[ConversationsQuery] addConversationToConversationsQuery for account ${account}`
  );
  const previousConversationsData = getConversationsQueryData({
    account,
  });

  if (!previousConversationsData) {
    queryClient.setQueryData<IConversationsQuery>(
      getConversationsQueryOptions({ account }).queryKey,
      [conversation]
    );
    return;
  }

  // ... rest of function remains the same ...
};

// Update other functions similarly by removing context parameter from getConversationsQueryOptions calls
```

The changes involve:
1. Removing the `context` parameter from the `getConversations` function and its calls
2. Removing `context` from `getConversationsQueryOptions` parameters and its usage
3. Updating all calls to `getConversationsQueryOptions` to remove the context parameter
4. Simplifying the debug logging that used the context parameter

The functionality remains the same, just without the context tracking.

---



---

