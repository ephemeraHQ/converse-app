## SpecStory

## Implementing useConversationDataQuery (1/13/2025, 10:50:30 AM)

_**User**_

implemnet something like but for useConversationDataQuery

---

_**Assistant**_

I'll help you create a `useConversationDataQuery.ts` file following the same pattern as `useConversationQuery.ts`. This will be a new file that handles conversation data queries.

```typescript:queries/useConversationDataQuery.ts
import { UseQueryOptions, useQuery } from "@tanstack/react-query";
import { getConversationData } from "@utils/xmtpRN/conversations";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { conversationDataQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";
import { mutateObjectProperties } from "@/utils/mutate-object-properties";

export type ConversationDataQueryData = Awaited<ReturnType<typeof getConversationData>>;

type IArgs = {
  account: string;
  topic: ConversationTopic;
};

function getConversationData(args: IArgs) {
  const { account, topic } = args;
  return getConversationData({
    account,
    topic,
  });
}

export const useConversationDataQuery = (
  args: IArgs & {
    queryOptions?: Partial<UseQueryOptions<ConversationDataQueryData>>;
  }
) => {
  const { account, topic, queryOptions } = args;
  return useQuery({
    ...getConversationDataQueryOptions({ account, topic }),
    ...queryOptions,
  });
};

export function getConversationDataQueryOptions(args: IArgs) {
  const { account, topic } = args;
  return {
    queryKey: conversationDataQueryKey(account, topic),
    queryFn: () => getConversationData({ account, topic: topic! }),
    enabled: !!topic,
  };
}

export const setConversationDataQueryData = (
  args: IArgs & {
    conversationData: ConversationDataQueryData;
  }
) => {
  const { account, topic, conversationData } = args;
  queryClient.setQueryData<ConversationDataQueryData>(
    conversationDataQueryKey(account, topic),
    conversationData
  );
};

export function updateConversationDataQueryData(
  args: IArgs & { conversationDataUpdate: Partial<ConversationDataQueryData> }
) {
  const { account, topic, conversationDataUpdate } = args;
  queryClient.setQueryData<ConversationDataQueryData>(
    conversationDataQueryKey(account, topic),
    (previousConversationData) => {
      if (!previousConversationData) {
        return undefined;
      }
      return mutateObjectProperties(previousConversationData, conversationDataUpdate);
    }
  );
}

export function refetchConversationDataQuery(args: IArgs) {
  const { account, topic } = args;
  return queryClient.refetchQueries({
    queryKey: conversationDataQueryKey(account, topic),
  });
}

export const getConversationDataQueryData = (args: IArgs) => {
  const { account, topic } = args;
  return queryClient.getQueryData<ConversationDataQueryData>(
    conversationDataQueryKey(account, topic)
  );
};
```

This implementation follows the same pattern as `useConversationQuery.ts` but for conversation data. The key differences are:

1. All naming has been updated to include "Data" (e.g., `useConversationDataQuery`, `conversationDataQueryKey`)
2. The types have been updated to use `ConversationDataQueryData`
3. The query uses `conversationDataQueryKey` instead of `conversationQueryKey`
4. The base function `getConversationData` is called instead of `getConversationByTopicByAccount`
5. Removed the `includeSync` parameter as it's not needed for the data query

You'll need to ensure that:
1. `conversationDataQueryKey` is defined in your QueryKeys file
2. `getConversationData` function exists in your utils/xmtpRN/conversations
3. The return type of `getConversationData` matches your needs

---



---

