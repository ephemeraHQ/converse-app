## SpecStory

## Optimizing Conversation Query Management (12/18/2024, 7:14:52 AM)

_**User**_

do you think it's possible to make this query derive @useConversationQuery.ts ?

But also have something like that:

import { useQuery, useQueryClient, QueryObserver } from "@tanstack/react-query";
import { getConversationByTopicByAccount } from "@utils/xmtpRN/conversations";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { conversationListQueryKey } from "./useConversationListQuery";

export type ConversationQueryData = {
  topic: string;
  name: string;
  version: string;
};

type IArgs = {
  account: string;
  topic: ConversationTopic;
};

export const useConversationQuery = (args: IArgs) => {
  const { account, topic } = args;
  const queryClient = useQueryClient();

  // Initial Query: Fetch single conversation as a fallback
  const query = useQuery<ConversationQueryData>({
    queryKey: ["conversation", account, topic],
    queryFn: () =>
      getConversationByTopicByAccount({
        account,
        topic,
        includeSync: false,
      }),
    enabled: !!topic,
    initialData: () => {
      // Immediately derive the conversation from the list cache if available
      const conversations = queryClient.getQueryData<ConversationQueryData[]>(
        conversationListQueryKey(account)
      );
      return conversations?.find((c) => c.topic === topic);
    },
  });

  // Sync with the List Cache Reactively
  React.useEffect(() => {
    const observer = new QueryObserver<ConversationQueryData[]>(queryClient, {
      queryKey: conversationListQueryKey(account),
    });

    const unsubscribe = observer.subscribe((result) => {
      const updatedConversation = result.data?.find((c) => c.topic === topic);

      if (updatedConversation) {
        // Update the single conversation query cache with the new data
        queryClient.setQueryData(["conversation", account, topic], updatedConversation);
      }
    });

    return () => unsubscribe();
  }, [queryClient, account, topic]);

  return query;
};

Where we would make sure that if we don't have the converation in the list we can fetch it with our "getConversationByPeerByAccount"

---

_**Assistant**_

Yes, we can combine both approaches to create a more efficient query that derives from the conversation list while maintaining the ability to fetch individual conversations when needed. Here's how we can modify the code:

```typescript:queries/useDmQuery.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DmWithCodecsType } from "@utils/xmtpRN/client";
import { getConversationByPeerByAccount } from "@utils/xmtpRN/conversations";
import { dmQueryKey, conversationListQueryKey } from "./QueryKeys";
import { getConversationQueryOptions } from "./useConversationQuery";
import { useEffect } from "react";

type IDmQueryArgs = {
  account: string;
  peer: string;
};

export function useDmQuery(args: IDmQueryArgs) {
  const { account, peer } = args;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: dmQueryKey(account, peer),
    queryFn: async () => {
      const conversation = await getConversationByPeerByAccount({
        account,
        peer,
        includeSync: true,
      });

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Update conversation cache
      queryClient.setQueryData(
        getConversationQueryOptions({ account, topic: conversation.topic }).queryKey,
        conversation
      );

      return conversation;
    },
    enabled: !!peer,
    initialData: () => {
      // Try to find the conversation in the list cache first
      const conversations = queryClient.getQueryData<DmWithCodecsType[]>(
        conversationListQueryKey(account)
      );
      return conversations?.find((c) => c.peerAddress === peer);
    },
  });

  // Keep in sync with conversation list
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe({
      onSuccess: (query) => {
        if (query.queryKey[0] === conversationListQueryKey(account)[0]) {
          const conversations = query.state.data as DmWithCodecsType[] | undefined;
          const updatedConversation = conversations?.find(
            (c) => c.peerAddress === peer
          );

          if (updatedConversation) {
            queryClient.setQueryData(
              dmQueryKey(account, peer),
              updatedConversation
            );
          }
        }
      },
    });

    return () => unsubscribe();
  }, [queryClient, account, peer]);

  return query;
}

// Helper function can remain the same
export function updateDmQueryData(
  account: string,
  peer: string,
  newConversation: DmWithCodecsType
) {
  return queryClient.setQueryData(dmQueryKey(account, peer), newConversation);
}
```

Key changes and improvements:

1. Added `initialData` to derive from conversation list cache
2. Added subscription to conversation list changes to keep DM query in sync
3. Simplified error handling
4. Maintained backwards compatibility with conversation query cache
5. Removed redundant type definitions
6. Kept the ability to fetch individual conversations when not in list

This implementation will:
1. First try to get data from the conversation list cache
2. If not found, fetch the individual conversation
3. Stay in sync with the conversation list updates
4. Update both DM and conversation caches when new data arrives

The query will be more efficient as it:
- Reduces unnecessary fetches by using cached data
- Maintains consistency across different query caches
- Still works as a fallback when conversations aren't in the list

---



---

