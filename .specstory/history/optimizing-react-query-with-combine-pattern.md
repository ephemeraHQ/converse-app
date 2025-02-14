## SpecStory

## Optimizing React Query with Combine Pattern (1/17/2025, 2:23:47 PM)

_**User**_

can i use combine pattern from react-query @https://tanstack.com/query/latest/docs/framework/react/reference/useQueries 

---

_**Assistant**_

Yes, you can use the `combine` pattern from React Query's `useQueries` to optimize your `useBlockedConversationsForCurrentAccount` hook. This would help reduce unnecessary re-renders and make the code more efficient. Here's how you can refactor it:

```typescript:features/blocked-conversations/use-blocked-conversations-for-current-account.ts
import { isConversationDenied } from "@/features/conversation/utils/is-conversation-denied";
import { getConversationMetadataQueryOptions } from "@/queries/conversation-metadata-query";
import { useConversationsQuery } from "@/queries/conversations-query";
import { useCurrentAccount } from "@data/store/accountsStore";
import { useQueries } from "@tanstack/react-query";
import { useCallback } from "react";

export function useBlockedConversationsForCurrentAccount() {
  const currentAccount = useCurrentAccount();

  const { data: conversations } = useConversationsQuery({
    account: currentAccount!,
  });

  // Memoize the combine function to prevent unnecessary recalculations
  const combineResults = useCallback((results: any[]) => {
    if (!conversations) return [];

    return conversations.filter((conversation, index) => {
      const metadata = results[index]?.data;
      return metadata?.isDeleted || isConversationDenied(conversation);
    });
  }, [conversations]);

  const { data } = useQueries({
    queries: (conversations ?? []).map((conversation) =>
      getConversationMetadataQueryOptions({
        account: currentAccount!,
        topic: conversation.topic,
      })
    ),
    combine: combineResults,
  });

  return { data };
}
```

Key improvements in this refactored version:

1. Uses the `combine` pattern to efficiently process query results
2. Memoizes the combine function with `useCallback` to prevent unnecessary recalculations
3. Removes the separate `useMemo` since the combining logic is now handled by React Query
4. Returns the combined data directly from `useQueries`

This approach is more efficient because:
- It reduces the number of re-renders by handling data combination at the query level
- The combine function only runs when either the queries' results or the combine function itself changes
- It maintains structural sharing for better performance

The functionality remains the same, but the implementation is more optimized and follows React Query's best practices.

---

_**User**_

any other patterns i can do here ? maybe like use useQueries and have conversationsQuery and converstaionsMetadataQueries and the combine?

---

_**Assistant**_

Yes, that's a great suggestion! We can combine both queries using `useQueries` for better organization and efficiency. Here's the improved version:

```typescript:features/blocked-conversations/use-blocked-conversations-for-current-account.ts
import { isConversationDenied } from "@/features/conversation/utils/is-conversation-denied";
import { getConversationMetadataQueryOptions } from "@/queries/conversation-metadata-query";
import { getConversationsQueryOptions } from "@/queries/conversations-query";
import { useCurrentAccount } from "@data/store/accountsStore";
import { useQueries } from "@tanstack/react-query";
import { useCallback } from "react";

export function useBlockedConversationsForCurrentAccount() {
  const currentAccount = useCurrentAccount();

  // Memoize the combine function to prevent unnecessary recalculations
  const combineResults = useCallback(([conversationsResult, ...metadataResults]: any[]) => {
    const conversations = conversationsResult.data;
    if (!conversations) return [];

    return conversations.filter((conversation, index) => {
      const metadata = metadataResults[index]?.data;
      return metadata?.isDeleted || isConversationDenied(conversation);
    });
  }, []);

  const { data } = useQueries({
    queries: [
      // First query for conversations
      getConversationsQueryOptions({
        account: currentAccount!,
      }),
      // Rest of the queries for metadata, only if we have conversations
      ...(conversationsResult?.data ?? []).map((conversation) =>
        getConversationMetadataQueryOptions({
          account: currentAccount!,
          topic: conversation.topic,
        })
      ),
    ],
    combine: combineResults,
  });

  return { data };
}
```

However, there's a problem with this approach - we can't access `conversationsResult` before defining the queries. Let's fix that by using two separate `useQueries` calls and combining them:

```typescript:features/blocked-conversations/use-blocked-conversations-for-current-account.ts
import { isConversationDenied } from "@/features/conversation/utils/is-conversation-denied";
import { getConversationMetadataQueryOptions } from "@/queries/conversation-metadata-query";
import { getConversationsQueryOptions } from "@/queries/conversations-query";
import { useCurrentAccount } from "@data/store/accountsStore";
import { useQueries } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

export function useBlockedConversationsForCurrentAccount() {
  const currentAccount = useCurrentAccount();

  // First query for conversations
  const { data: conversationsResult } = useQueries({
    queries: [
      getConversationsQueryOptions({
        account: currentAccount!,
      }),
    ],
    combine: (results) => results[0],
  });

  // Memoize the combine function for metadata results
  const combineMetadataResults = useCallback((results: any[]) => {
    const conversations = conversationsResult?.data;
    if (!conversations) return [];

    return conversations.filter((conversation, index) => {
      const metadata = results[index]?.data;
      return metadata?.isDeleted || isConversationDenied(conversation);
    });
  }, [conversationsResult]);

  // Second query for metadata of each conversation
  const { data: blockedConversations } = useQueries({
    queries: (conversationsResult?.data ?? []).map((conversation) =>
      getConversationMetadataQueryOptions({
        account: currentAccount!,
        topic: conversation.topic,
      })
    ),
    combine: combineMetadataResults,
  });

  return { data: blockedConversations };
}
```

This version offers several advantages:

1. Clearer separation of concerns between fetching conversations and their metadata
2. More explicit data flow and dependencies
3. Better type safety since we can properly type each query's result
4. More efficient querying since metadata queries only run after conversations are fetched
5. Easier to add loading/error states for each query stage if needed
6. Better control over the query lifecycle and caching

You could even take it a step further and add loading/error handling:

```typescript:features/blocked-conversations/use-blocked-conversations-for-current-account.ts
import { isConversationDenied } from "@/features/conversation/utils/is-conversation-denied";
import { getConversationMetadataQueryOptions } from "@/queries/conversation-metadata-query";
import { getConversationsQueryOptions } from "@/queries/conversations-query";
import { useCurrentAccount } from "@data/store/accountsStore";
import { useQueries } from "@tanstack/react-query";
import { useCallback } from "react";

export function useBlockedConversationsForCurrentAccount() {
  const currentAccount = useCurrentAccount();

  // First query for conversations
  const { 
    data: conversationsResult,
    isLoading: isLoadingConversations,
    error: conversationsError 
  } = useQueries({
    queries: [
      getConversationsQueryOptions({
        account: currentAccount!,
      }),
    ],
    combine: (results) => ({
      data: results[0].data,
      isLoading: results[0].isLoading,
      error: results[0].error,
    }),
  });

  // Memoize the combine function for metadata results
  const combineMetadataResults = useCallback((results: any[]) => {
    const conversations = conversationsResult?.data;
    if (!conversations) return [];

    const isLoading = results.some((result) => result.isLoading);
    const error = results.find((result) => result.error)?.error;
    const data = conversations.filter((conversation, index) => {
      const metadata = results[index]?.data;
      return metadata?.isDeleted || isConversationDenied(conversation);
    });

    return { data, isLoading, error };
  }, [conversationsResult]);

  // Second query for metadata of each conversation
  const { 
    data: blockedConversations,
    isLoading: isLoadingMetadata,
    error: metadataError 
  } = useQueries({
    queries: (conversationsResult?.data ?? []).map((conversation) =>
      getConversationMetadataQueryOptions({
        account: currentAccount!,
        topic: conversation.topic,
      })
    ),
    combine: combineMetadataResults,
  });

  return {
    data: blockedConversations,
    isLoading: isLoadingConversations || isLoadingMetadata,
    error: conversationsError || metadataError,
  };
}
```

This final version provides a complete solution with proper loading and error handling, while maintaining efficient querying and data combination patterns.

---

_**User**_

ah but it doens't work because I need to get the conversations first...

---

_**Assistant**_

Ah yes, you're right! We need to get the conversations data first before we can set up the metadata queries. Let's modify the approach to use the conversations data directly:

```typescript:features/blocked-conversations/use-blocked-conversations-for-current-account.ts
import { isConversationDenied } from "@/features/conversation/utils/is-conversation-denied";
import { getConversationMetadataQueryOptions } from "@/queries/conversation-metadata-query";
import { useConversationsQuery } from "@/queries/conversations-query";
import { useCurrentAccount } from "@data/store/accountsStore";
import { useQueries } from "@tanstack/react-query";
import { useCallback } from "react";

export function useBlockedConversationsForCurrentAccount() {
  const currentAccount = useCurrentAccount();

  // First get conversations
  const { data: conversations } = useConversationsQuery({
    account: currentAccount!,
  });

  // Memoize the combine function for metadata results
  const combineMetadataResults = useCallback((results: any[]) => {
    if (!conversations) return [];

    return conversations.filter((conversation, index) => {
      const metadata = results[index]?.data;
      return metadata?.isDeleted || isConversationDenied(conversation);
    });
  }, [conversations]);

  // Then query metadata with combine pattern
  const { data: blockedConversations } = useQueries({
    queries: (conversations ?? []).map((conversation) =>
      getConversationMetadataQueryOptions({
        account: currentAccount!,
        topic: conversation.topic,
      })
    ),
    combine: combineMetadataResults,
  });

  return { data: blockedConversations };
}
```

This version:
1. Uses `useConversationsQuery` first to get the conversations
2. Only after we have conversations, sets up the metadata queries with `useQueries`
3. Uses the `combine` pattern to efficiently process the metadata results
4. Maintains the same functionality as the original but with better performance

The key difference is that we're using the regular query hook for conversations since we need that data to set up the metadata queries, and then using `useQueries` with `combine` for the metadata part.

---



---

