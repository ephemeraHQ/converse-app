## SpecStory

## Syncing Conversation Data with List (12/18/2024, 9:00:30 AM)

_**User**_

need to add something like that because conversation in list are source of truth

// Keep in sync with conversation list
  useEffect(() => {
    const observer = new QueryObserver(
      queryClient,
      conversationListQueryConfig({ account, context: "dm" })
    );

    observer.subscribe(({ data }) => {
      const conversations = data as DmWithCodecsType[];
      const currentConversation = queryClient.getQueryData<IDmQueryData>(
        dmQueryKey(account, peer)
      );
      const listConversation = conversations?.find(
        (c) => c.topic === currentConversation?.topic
      );
      if (listConversation) {
        // List is source of truth
        queryClient.setQueryData<IDmQueryData>(
          dmQueryKey(account, peer),
          listConversation
        );
      }
    });

    return () => observer.destroy();
  }, [queryClient, account, peer]);

---

_**Assistant**_

I'll help you add the conversation list sync functionality to the `useConversationQuery` hook. Here's how we can modify the file:

```typescript:queries/useConversationQuery.ts
// ... existing imports ...
import { QueryObserver } from "@tanstack/react-query";
import { conversationListQueryConfig } from "./useConversationListQuery"; // Add this import

export const useConversationQuery = (
  args: IArgs & {
    queryOptions?: Partial<UseQueryOptions<ConversationQueryData>>;
  }
) => {
  const { account, topic, queryOptions } = args;
  
  // Add effect to sync with conversation list
  React.useEffect(() => {
    const observer = new QueryObserver(
      queryClient,
      conversationListQueryConfig({ account })
    );

    const subscription = observer.subscribe(({ data }) => {
      const conversations = data as ConversationQueryData[];
      const currentConversation = queryClient.getQueryData<ConversationQueryData>(
        conversationQueryKey(account, topic)
      );
      
      const listConversation = conversations?.find(
        (c) => c.topic === currentConversation?.topic
      );

      if (listConversation) {
        queryClient.setQueryData<ConversationQueryData>(
          conversationQueryKey(account, topic),
          listConversation
        );
      }
    });

    return () => subscription.unsubscribe();
  }, [account, topic]);

  return useQuery({
    ...getConversationQueryOptions({ account, topic }),
    ...queryOptions,
  });
};
```

Key changes made:
1. Added imports for `QueryObserver` and `conversationListQueryConfig`
2. Added a `useEffect` hook that:
   - Creates a query observer for the conversation list
   - Subscribes to changes in the conversation list
   - When the list updates, finds the matching conversation and updates the individual conversation query data
   - Properly cleans up the subscription on unmount
3. Maintains the original query functionality while adding the sync behavior

Make sure you have the corresponding `conversationListQueryConfig` function in your `useConversationListQuery` file. The sync ensures that individual conversation data stays in sync with the conversation list, which acts as the source of truth.

---

_**User**_

but i still need to fetch the indiviual conversation in case it's not in the list

like this kind of ...

export function useDmQuery(args: IDmQueryArgs) {
  const { account, peer } = args;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: dmQueryKey(account, peer),
    queryFn: () => getDm(args),
    enabled: !!peer,
  });

  // Keep in sync with conversation list
  useEffect(() => {
    const observer = new QueryObserver(
      queryClient,
      conversationListQueryConfig({ account, context: "dm" })
    );

    observer.subscribe(({ data }) => {
      const conversations = data as DmWithCodecsType[];
      const currentConversation = queryClient.getQueryData<IDmQueryData>(
        dmQueryKey(account, peer)
      );
      const listConversation = conversations?.find(
        (c) => c.topic === currentConversation?.topic
      );
      if (listConversation) {
        // List is source of truth
        queryClient.setQueryData<IDmQueryData>(
          dmQueryKey(account, peer),
          listConversation
        );
      }
    });

    return () => observer.destroy();
  }, [queryClient, account, peer]);

  return query;
}

---

_**Assistant**_

I'll modify the `useConversationQuery` to include both the individual conversation fetch and list sync functionality:

```typescript:queries/useConversationQuery.ts
export const useConversationQuery = (
  args: IArgs & {
    queryOptions?: Partial<UseQueryOptions<ConversationQueryData>>;
  }
) => {
  const { account, topic, queryOptions } = args;
  
  // Individual conversation query
  const query = useQuery({
    ...getConversationQueryOptions({ account, topic }),
    ...queryOptions,
  });

  // Keep in sync with conversation list
  React.useEffect(() => {
    const observer = new QueryObserver(
      queryClient,
      conversationListQueryConfig({ account })
    );

    const subscription = observer.subscribe(({ data }) => {
      const conversations = data as ConversationQueryData[];
      const currentConversation = queryClient.getQueryData<ConversationQueryData>(
        conversationQueryKey(account, topic)
      );
      
      const listConversation = conversations?.find(
        (c) => c.topic === currentConversation?.topic
      );

      if (listConversation) {
        // List is source of truth
        queryClient.setQueryData<ConversationQueryData>(
          conversationQueryKey(account, topic),
          listConversation
        );
      }
    });

    return () => subscription.unsubscribe();
  }, [account, topic]);

  return query;
};
```

The key differences are:
1. We maintain the original query that fetches the individual conversation
2. The `useEffect` sync mechanism works alongside it, updating the data when the conversation is found in the list
3. If the conversation isn't in the list, we still have the individual conversation data from the query

This way we get the best of both worlds:
- Fast initial load if the conversation is in the list
- Fallback to individual fetch if it's not
- Continuous sync with the list as the source of truth

---



---

