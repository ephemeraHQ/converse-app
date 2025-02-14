## SpecStory

## Single Group Message Retrieval Query (11/18/2024, 11:38:49 AM)

_**User**_

I want something for useGroupMessage (singular message) 

check this @useGroupMessages.ts 

---

_**Assistant**_

To create a `useGroupMessage` hook similar to `useGroupMessages`, you can follow a similar pattern but focus on fetching a single message. Here's a simplified version of what that might look like:

```typescript:queries/useGroupMessage.ts
import {
  QueryObserver,
  QueryObserverResult,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";

import logger from "@utils/logger";
import { DecodedMessageWithCodecsType } from "@utils/xmtpRN/client";
import { cacheOnlyQueryOptions } from "./cacheOnlyQueryOptions";
import { entify, EntityObject } from "./entify";
import { queryClient } from "./queryClient";
import { groupMessageQueryKey } from "./QueryKeys"; // Assume you have a similar key generator
import { useGroupConversationScreenQuery } from "./useGroupQuery";
import { useRefreshOnFocus } from "./useRefreshOnFocus";

export type EntifiedMessageType = EntityObject<DecodedMessageWithCodecsType>;

export const useGroupMessage = (
  account: string,
  topic: string,
  messageId: string,
  options?: Partial<UseQueryOptions<EntifiedMessageType>>
) => {
  const { data: group } = useGroupConversationScreenQuery(
    account,
    topic,
    cacheOnlyQueryOptions
  );

  const queryData = useQuery({
    queryKey: groupMessageQueryKey(account, topic, messageId),
    queryFn: async () => {
      logger.info("[Crash Debug] queryFn fetching single message");
      if (!group) {
        return null;
      }
      const message = await group.getMessageById(messageId);
      return entify([message], (msg) => msg.id)[0];
    },
    enabled: !!group,
    ...options,
  });

  useRefreshOnFocus(async (): Promise<void> => {
    if (options?.refetchOnWindowFocus) {
      await queryData.refetch();
    }
  });

  return queryData;
};

export const getGroupMessage = (account: string, topic: string, messageId: string) => {
  return queryClient.getQueryData<EntifiedMessageType>(
    groupMessageQueryKey(account, topic, messageId)
  );
};

export function subscribeToGroupMessage(args: {
  account: string;
  topic: string;
  messageId: string;
  callback: (data: QueryObserverResult<EntifiedMessageType, Error>) => void;
}) {
  const observer = new QueryObserver<EntifiedMessageType>(queryClient, {
    queryKey: groupMessageQueryKey(args.account, args.topic, args.messageId),
  });
  return observer.subscribe(args.callback);
}

const setGroupMessage = (
  account: string,
  topic: string,
  messageId: string,
  message: DecodedMessageWithCodecsType
) => {
  queryClient.setQueryData(groupMessageQueryKey(account, topic, messageId), message);
};

export const addGroupMessage = (
  account: string,
  topic: string,
  message: DecodedMessageWithCodecsType
) => {
  setGroupMessage(account, topic, message.id, message);
};
```

### Key Changes:
- **Query Key**: Added `messageId` to the query key to uniquely identify a single message.
- **Query Function**: Fetches a single message using `getMessageById` (assuming such a method exists).
- **Types**: Adjusted types to handle a single message.
- **Helper Functions**: Created `getGroupMessage`, `subscribeToGroupMessage`, and `setGroupMessage` for single message operations.

Ensure you have a method like `getMessageById` in your group object to fetch a single message by its ID. Adjust the `groupMessageQueryKey` function to generate keys for individual messages.

---



---

