## SpecStory

## Group Consent Query Options Creation (1/23/2025, 11:48:28 AM)

_**User**_

create something like but just with queryOptions and the queryFn empty

---

_**Assistant**_

I'll help create a new query options file for group consent following the pattern from the conversation metadata query, but with empty query function implementation.

```typescript:features/consent/group-consent-query.ts
import { groupConsentQueryKey } from "@/queries/QueryKeys";
import { queryOptions } from "@tanstack/react-query";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { queryClient } from "@/queries/queryClient";

type IArgs = {
  account: string;
  topic: ConversationTopic;
};

export type IGroupConsentQueryData = {
  // TODO: Define the type based on the actual data structure
  state: string;
};

export function getGroupConsentQueryOptions({ account, topic }: IArgs) {
  return queryOptions({
    queryKey: groupConsentQueryKey(account, topic),
    queryFn: () => getGroupConsent({ account, topic }),
    enabled: !!topic && !!account,
  });
}

export function prefetchGroupConsentQuery(account: string, topic: ConversationTopic) {
  return queryClient.prefetchQuery(
    getGroupConsentQueryOptions({ account, topic })
  );
}

export const getGroupConsentQueryData = (args: IArgs) => {
  const { account, topic } = args;
  return queryClient.getQueryData<IGroupConsentQueryData>(
    getGroupConsentQueryOptions({ account, topic }).queryKey
  );
};

export function updateGroupConsentQueryData(
  args: IArgs & { updateData: Partial<IGroupConsentQueryData> }
) {
  const { updateData, account, topic } = args;
  queryClient.setQueryData(
    getGroupConsentQueryOptions({ account, topic }).queryKey,
    (previousData: IGroupConsentQueryData | undefined) => ({
      ...(previousData ?? {}),
      ...updateData,
    })
  );
}

async function getGroupConsent(args: IArgs): Promise<IGroupConsentQueryData> {
  // TODO: Implement the actual query function
  throw new Error("Not implemented");
}
```

This creates a query options file with:
- Query options configuration
- Type definitions
- Helper functions for prefetching and updating query data
- An empty query function to be implemented later

The structure follows the pattern from the conversation metadata query file while keeping it focused on group consent functionality. You'll need to:

1. Define the actual `IGroupConsentQueryData` type structure
2. Implement the `getGroupConsent` function
3. Ensure `groupConsentQueryKey` is defined in your QueryKeys file

---

_**User**_

But the name file is xmtp-sync-query 

---

_**Assistant**_

Ah, I'll create a query options file specifically for XMTP sync following the same pattern.

```typescript:queries/xmtp-sync-query.ts
import { xmtpSyncQueryKey } from "@/queries/QueryKeys";
import { queryOptions } from "@tanstack/react-query";
import { queryClient } from "@/queries/queryClient";

type IArgs = {
  account: string;
};

export type IXmtpSyncQueryData = {
  // TODO: Define the type based on the actual sync data structure
  isSynced: boolean;
};

export function getXmtpSyncQueryOptions({ account }: IArgs) {
  return queryOptions({
    queryKey: xmtpSyncQueryKey(account),
    queryFn: () => getXmtpSync({ account }),
    enabled: !!account,
  });
}

export function prefetchXmtpSyncQuery(account: string) {
  return queryClient.prefetchQuery(
    getXmtpSyncQueryOptions({ account })
  );
}

export const getXmtpSyncQueryData = (args: IArgs) => {
  const { account } = args;
  return queryClient.getQueryData<IXmtpSyncQueryData>(
    getXmtpSyncQueryOptions({ account }).queryKey
  );
};

export function updateXmtpSyncQueryData(
  args: IArgs & { updateData: Partial<IXmtpSyncQueryData> }
) {
  const { updateData, account } = args;
  queryClient.setQueryData(
    getXmtpSyncQueryOptions({ account }).queryKey,
    (previousData: IXmtpSyncQueryData | undefined) => ({
      ...(previousData ?? {}),
      ...updateData,
    })
  );
}

async function getXmtpSync(args: IArgs): Promise<IXmtpSyncQueryData> {
  // TODO: Implement the actual sync query function
  throw new Error("Not implemented");
}
```

This creates a query options file for XMTP sync with:
- Query options configuration
- Basic type definitions
- Helper functions for prefetching and updating query data
- An empty query function to be implemented later

You'll need to:
1. Define the actual `IXmtpSyncQueryData` type structure based on your sync requirements
2. Implement the `getXmtpSync` function
3. Ensure `xmtpSyncQueryKey` is defined in your QueryKeys file

---



---

