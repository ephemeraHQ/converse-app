## SpecStory

## Adapting Unknown Consent Conversations Query (1/21/2025, 5:01:10 PM)

_**User**_

I want the same kind of stuff that I have in @use-conversations-query.ts here. But here the naming is a bit different because it's for unknown conversations

---

_**Assistant**_

I'll help you add similar functionality to the unknown-consent-conversations-query.ts file, following the same patterns as use-conversations-query.ts. Here are the necessary additions:

```typescript:queries/unknown-consent-conversations-query.ts
import { unknownConsentConversationsQueryKey } from "@/queries/QueryKeys";
import { setConversationQueryData } from "@/queries/conversation-query";
import { captureError } from "@/utils/capture-error";
import logger from "@/utils/logger";
import { ConversationWithCodecsType, ConverseXmtpClientType } from "@/utils/xmtpRN/client.types";
import { getXmtpClient } from "@/utils/xmtpRN/sync";
import { QueryObserver, queryOptions, useQuery } from "@tanstack/react-query";
import { reactQueryPersister } from "@/utils/mmkv";
import { updateObjectAndMethods } from "@/utils/update-object-and-methods";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { queryClient } from "./queryClient";

export type IUnknownConversationsQuery = Awaited<ReturnType<typeof getUnknownConversations>>;

// ... existing getUnknownConversations function ...

export const createUnknownConsentConversationsQueryObserver = (args: { account: string }) => {
  logger.debug(
    `[UnknownConversationsQuery] createUnknownConsentConversationsQueryObserver for account ${args.account}`
  );
  return new QueryObserver(queryClient, getUnknownConsentConversationsQueryOptions(args));
};

export const useUnknownConsentConversationsQuery = (args: { account: string; caller: string }) => {
  return useQuery<IUnknownConversationsQuery>(getUnknownConsentConversationsQueryOptions(args));
};

export const prefetchUnknownConsentConversationsQuery = (args: { account: string }) => {
  return queryClient.prefetchQuery(getUnknownConsentConversationsQueryOptions(args));
};

export const addConversationToUnknownConsentConversationsQuery = (args: {
  account: string;
  conversation: ConversationWithCodecsType;
}) => {
  const { account, conversation } = args;
  logger.debug(
    `[UnknownConversationsQuery] addConversationToUnknownConsentConversationsQuery for account ${account}`
  );
  const previousConversationsData = getUnknownConsentConversationsQueryData({
    account,
  });

  if (!previousConversationsData) {
    queryClient.setQueryData<IUnknownConversationsQuery>(
      getUnknownConsentConversationsQueryOptions({ account }).queryKey,
      [conversation]
    );
    return;
  }

  const conversationExists = previousConversationsData.some(
    (c) => c.topic === conversation.topic
  );

  if (conversationExists) {
    return;
  }

  queryClient.setQueryData<IUnknownConversationsQuery>(
    getUnknownConsentConversationsQueryOptions({ account }).queryKey,
    [conversation, ...previousConversationsData]
  );
};

export const getUnknownConsentConversationsQueryData = (args: { account: string }) => {
  return queryClient.getQueryData<IUnknownConversationsQuery>(
    getUnknownConsentConversationsQueryOptions(args).queryKey
  );
};

export const updateConversationInUnknownConsentConversationsQueryData = (args: {
  account: string;
  topic: ConversationTopic;
  conversationUpdate: Partial<ConversationWithCodecsType>;
}) => {
  const { account, topic, conversationUpdate } = args;

  logger.debug(
    `[UnknownConversationsQuery] updateConversationInUnknownConsentConversationsQueryData for account ${account} and topic ${topic}`
  );

  const previousConversationsData = getUnknownConsentConversationsQueryData({
    account,
  });
  if (!previousConversationsData) {
    return;
  }
  const newConversations = previousConversationsData.map((c) => {
    if (c.topic === topic) {
      return updateObjectAndMethods(c, conversationUpdate);
    }
    return c;
  });

  queryClient.setQueryData<IUnknownConversationsQuery>(
    getUnknownConsentConversationsQueryOptions({
      account,
    }).queryKey,
    newConversations
  );
};

export function fetchUnknownConsentConversationsQuery(args: { account: string; caller: string }) {
  return queryClient.fetchQuery(getUnknownConsentConversationsQueryOptions(args));
}

// Update the existing getUnknownConsentConversationsQueryOptions to match the pattern
export function getUnknownConsentConversationsQueryOptions(args: {
  account: string;
  caller?: string;
}) {
  const { account, caller } = args;
  return queryOptions({
    queryFn: () => getUnknownConversations({ account }),
    queryKey: unknownConsentConversationsQueryKey(account),
    enabled: !!account,
    refetchOnMount: true,
    persister: reactQueryPersister,
  });
}
```

I've added all the equivalent functionality from use-conversations-query.ts, but adapted for unknown consent conversations. This includes:

1. Query observer creation
2. Hook for using the query
3. Prefetch functionality
4. Functions to add and update conversations in the query cache
5. Functions to get and fetch query data
6. Updated the query options to match the pattern

The main differences are:
- Renamed all functions to include "UnknownConsent" in their names
- Updated logging messages to reflect the unknown conversations context
- Kept the specific unknown conversations sync behavior

The functionality remains the same, just adapted for the unknown consent conversations use case.

---



---

