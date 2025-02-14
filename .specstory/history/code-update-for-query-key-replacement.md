## SpecStory

## Code Update for Query Key Replacement (1/13/2025, 10:55:30 AM)

_**User**_

replace "conversationDataQueryKey" with "getConversationDataQueryOptions(...).queryKey"

---

_**Assistant**_

I'll help you replace the direct usage of `conversationDataQueryKey` with `getConversationDataQueryOptions(...).queryKey`. Here are the necessary edits:

```typescript:queries/useConversationDataQuery.ts
// ... existing code ...

export const setConversationDataQueryData = (
  args: IArgs & {
    conversationData: ConversationDataQueryData;
  }
) => {
  const { account, topic, conversationData } = args;
  queryClient.setQueryData<ConversationDataQueryData>(
    getConversationDataQueryOptions({ account, topic }).queryKey,
    conversationData
  );
};

export function updateConversationDataQueryData(
  args: IArgs & { conversationDataUpdate: Partial<ConversationDataQueryData> }
) {
  const { account, topic, conversationDataUpdate } = args;
  queryClient.setQueryData<ConversationDataQueryData>(
    getConversationDataQueryOptions({ account, topic }).queryKey,
    (previousConversationData) => {
      if (!previousConversationData) {
        return undefined;
      }
      return mutateObjectProperties(
        previousConversationData,
        conversationDataUpdate
      );
    }
  );
}

export function refetchConversationDataQuery(args: IArgs) {
  const { account, topic } = args;
  return queryClient.refetchQueries({
    queryKey: getConversationDataQueryOptions({ account, topic }).queryKey,
  });
}

export const getConversationDataQueryData = (args: IArgs) => {
  const { account, topic } = args;
  return queryClient.getQueryData<ConversationDataQueryData>(
    getConversationDataQueryOptions({ account, topic }).queryKey
  );
};

// ... existing code ...
```

The changes replace all direct calls to `conversationDataQueryKey(account, topic)` with `getConversationDataQueryOptions({ account, topic }).queryKey`. This modification helps maintain consistency and reduces duplication by using the existing `getConversationDataQueryOptions` function to generate the query key.

---



---

