## SpecStory

## Adding Debug Logging to Query Functions (1/13/2025, 9:07:10 PM)

_**User**_

add logger.debug(`[QUERY... for each function

---

_**Assistant**_

I'll help you add logger.debug statements to each function. Here are the necessary edits:

```typescript:queries/useConversationListQuery.ts
// ... existing imports ...

export const createConversationListQueryObserver = (args: {
  account: string;
  context: string;
  includeSync?: boolean;
}) => {
  logger.debug(`[QUERY] createConversationListQueryObserver for account ${args.account}`);
  return new QueryObserver(queryClient, conversationListQueryConfig(args));
};

export const useConversationListQuery = (args: {
  account: string;
  queryOptions?: Partial<UseQueryOptions<ConversationListQueryData>>;
  context?: string;
}) => {
  const { account, queryOptions, context } = args;
  logger.debug(`[QUERY] useConversationListQuery for account ${account}`);
  return useQuery<ConversationListQueryData>({
    ...conversationListQueryConfig({ account, context: context ?? "" }),
    ...queryOptions,
  });
};

export const fetchPersistedConversationListQuery = (args: {
  account: string;
}) => {
  const { account } = args;
  logger.debug(`[QUERY] fetchPersistedConversationListQuery for account ${account}`);
  return queryClient.fetchQuery(/* ... */);
};

export const fetchConversationListQuery = (args: { account: string }) => {
  const { account } = args;
  logger.debug(`[QUERY] fetchConversationListQuery for account ${account}`);
  return queryClient.fetchQuery(/* ... */);
};

export const prefetchConversationListQuery = (args: { account: string }) => {
  const { account } = args;
  logger.debug(`[QUERY] prefetchConversationListQuery for account ${account}`);
  return queryClient.prefetchQuery(/* ... */);
};

export function refetchConversationListQuery(args: { account: string }) {
  const { account } = args;
  logger.debug(`[QUERY] refetchConversationListQuery for account ${account}`);
  return queryClient.refetchQueries(/* ... */);
}

export const addConversationToConversationListQuery = (args: {
  account: string;
  conversation: ConversationWithCodecsType;
}) => {
  const { account, conversation } = args;
  logger.debug(`[QUERY] addConversationToConversationListQuery for account ${account}`);
  // ... existing code ...
};

export const updateConversationInConversationListQuery = (args: {
  account: string;
  topic: ConversationTopic;
  conversationUpdate: Partial<ConversationWithCodecsType>;
}) => {
  const { account, topic } = args;
  logger.debug(`[QUERY] updateConversationInConversationListQuery for account ${account} and topic ${topic}`);
  // ... existing code ...
};

export const getConversationListQueryData = (args: { account: string }) => {
  const { account } = args;
  logger.debug(`[QUERY] getConversationListQueryData for account ${account}`);
  return queryClient.getQueryData<ConversationListQueryData>(/* ... */);
};

export const setConversationListQueryData = (args: {
  account: string;
  conversations: ConversationListQueryData;
}) => {
  const { account } = args;
  logger.debug(`[QUERY] setConversationListQueryData for account ${account}`);
  return queryClient.setQueryData<ConversationListQueryData>(/* ... */);
};

// ... rest of the file ...
```

I've added logger.debug statements at the beginning of each exported function, using the pattern `[QUERY] functionName` followed by relevant parameters (mainly the account, and topic where applicable). I've skipped the internal functions and kept only the exported ones as they're the main entry points that we want to track.

---

_**User**_

do [ConversationListQuery] instead

---

_**Assistant**_

I'll modify the logger statements to use [ConversationListQuery] instead:

```typescript:queries/useConversationListQuery.ts
// ... existing imports ...

export const createConversationListQueryObserver = (args: {
  account: string;
  context: string;
  includeSync?: boolean;
}) => {
  logger.debug(`[ConversationListQuery] createConversationListQueryObserver for account ${args.account}`);
  return new QueryObserver(queryClient, conversationListQueryConfig(args));
};

export const useConversationListQuery = (args: {
  account: string;
  queryOptions?: Partial<UseQueryOptions<ConversationListQueryData>>;
  context?: string;
}) => {
  const { account, queryOptions, context } = args;
  logger.debug(`[ConversationListQuery] useConversationListQuery for account ${account}`);
  return useQuery<ConversationListQueryData>({
    ...conversationListQueryConfig({ account, context: context ?? "" }),
    ...queryOptions,
  });
};

export const fetchPersistedConversationListQuery = (args: {
  account: string;
}) => {
  const { account } = args;
  logger.debug(`[ConversationListQuery] fetchPersistedConversationListQuery for account ${account}`);
  return queryClient.fetchQuery(/* ... */);
};

export const fetchConversationListQuery = (args: { account: string }) => {
  const { account } = args;
  logger.debug(`[ConversationListQuery] fetchConversationListQuery for account ${account}`);
  return queryClient.fetchQuery(/* ... */);
};

export const prefetchConversationListQuery = (args: { account: string }) => {
  const { account } = args;
  logger.debug(`[ConversationListQuery] prefetchConversationListQuery for account ${account}`);
  return queryClient.prefetchQuery(/* ... */);
};

export function refetchConversationListQuery(args: { account: string }) {
  const { account } = args;
  logger.debug(`[ConversationListQuery] refetchConversationListQuery for account ${account}`);
  return queryClient.refetchQueries(/* ... */);
}

export const addConversationToConversationListQuery = (args: {
  account: string;
  conversation: ConversationWithCodecsType;
}) => {
  const { account, conversation } = args;
  logger.debug(`[ConversationListQuery] addConversationToConversationListQuery for account ${account}`);
  // ... existing code ...
};

export const updateConversationInConversationListQuery = (args: {
  account: string;
  topic: ConversationTopic;
  conversationUpdate: Partial<ConversationWithCodecsType>;
}) => {
  const { account, topic } = args;
  logger.debug(`[ConversationListQuery] updateConversationInConversationListQuery for account ${account} and topic ${topic}`);
  // ... existing code ...
};

export const getConversationListQueryData = (args: { account: string }) => {
  const { account } = args;
  logger.debug(`[ConversationListQuery] getConversationListQueryData for account ${account}`);
  return queryClient.getQueryData<ConversationListQueryData>(/* ... */);
};

export const setConversationListQueryData = (args: {
  account: string;
  conversations: ConversationListQueryData;
}) => {
  const { account } = args;
  logger.debug(`[ConversationListQuery] setConversationListQueryData for account ${account}`);
  return queryClient.setQueryData<ConversationListQueryData>(/* ... */);
};

// ... rest of the file ...
```

I've replaced all `[QUERY]` with `[ConversationListQuery]` in the logger statements while keeping the rest of the logging information the same.

---



---

