## SpecStory

## Function Name Update for Conversations Query (1/31/2025, 11:18:25 AM)

_**User**_

and export don't have "AllowedConsent" in their function name6

---

_**Assistant**_

I'll help you update the function names to remove "AllowedConsent" while maintaining the same functionality. Here are the changes:

```typescript:queries/allowed-consent-conversations-query.ts
// ... existing code ...

export type IConversationsQuery = Awaited<ReturnType<typeof getConversations>>;

// ... existing code ...

export const createConversationsQueryObserver = (args: IArgs & { caller: string }) => {
  return new QueryObserver(queryClient, getConversationsQueryOptions(args));
};

export const useConversationsQuery = (args: IArgs & { caller: string }) => {
  return useQuery(getConversationsQueryOptions(args));
};

export function addConversationToQuery(
  args: IArgs & {
    conversation: ConversationWithCodecsType;
  }
) {
  const { account, conversation } = args;
  logger.debug(`[ConversationsQuery] addConversationToQuery for account ${account}`);
  const previousConversationsData = getConversationsQueryData({ account });

  // ... existing code ...
}

export const removeConversationFromQuery = (
  args: IArgs & {
    topic: ConversationTopic;
  }
) => {
  // ... existing code ...
};

export const getConversationsQueryData = (args: IArgs) => {
  return queryClient.getQueryData(getConversationsQueryOptions(args).queryKey);
};

const getConversations = async (args: IArgs) => {
  // ... existing code ...
};

export const getConversationsQueryOptions = (
  args: IArgs & {
    caller?: string;
  }
) => {
  // ... existing code ...
};

export const updateConversationInQueryData = (
  args: IArgs & {
    topic: ConversationTopic;
    conversationUpdate: Partial<ConversationWithCodecsType>;
  }
) => {
  // ... existing code ...
};

export function fetchConversationsQuery(args: IArgs & { caller: string }) {
  return queryClient.fetchQuery(getConversationsQueryOptions(args));
}
```

I've removed "AllowedConsent" from all function names while keeping their functionality intact. The main changes are:

1. Renamed type from `IAllowedConsentConversationsQuery` to `IConversationsQuery`
2. Simplified function names by removing "AllowedConsent", for example:
   - `createAllowedConsentConversationsQueryObserver` → `createConversationsQueryObserver`
   - `useAllowedConsentConversationsQuery` → `useConversationsQuery`
   - `addConversationToAllowedConsentConversationsQuery` → `addConversationToQuery`
   And so on...

Make sure to update any imports or references to these functions in other files as well.

---



---

