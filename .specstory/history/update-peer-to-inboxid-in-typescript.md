## SpecStory

## Update Peer to InboxId in TypeScript (2/3/2025, 2:15:30 PM)

_**User**_

i change all peer to inboxid

---

_**Assistant**_

I'll help you update the `useDmQuery.ts` file to change all instances of `peer` to `inboxId`. Here are the necessary changes:

```typescript:queries/useDmQuery.ts
// ... existing code ...

async function getDm(args: IDmQueryArgs) {
  const { account, inboxId } = args;

  const conversation = await getConversationByPeerByAccount({
    account,
    peer: inboxId, // This function still expects 'peer' parameter
  });

  if (conversation) {
    // Update the main conversation query because it's a 1-1
    setConversationQueryData({
      account,
      topic: conversation.topic,
      conversation,
    });
  }

  return conversation;
}

export function getDmQueryOptions(args: IDmQueryArgs) {
  const { account, inboxId } = args;
  return queryOptions({
    queryKey: dmQueryKey(account, inboxId),
    queryFn: () => getDm({ account, inboxId }),
    enabled: !!inboxId,
  });
}

// ... existing code ...

export function setDmQueryData(args: IDmQueryArgs & { dm: IDmQueryData }) {
  const { account, inboxId, dm } = args;
  queryClient.setQueryData(getDmQueryOptions({ account, inboxId }).queryKey, dm);
  if (dm) {
    // Update the main conversation query because it's a 1-1
    setConversationQueryData({
      account,
      topic: dm.topic,
      conversation: dm,
    });
  }
}

export function getDmQueryData(args: IDmQueryArgs) {
  return queryClient.getQueryData(getDmQueryOptions(args).queryKey);
}
```

The main changes are:
1. Updated function parameters to consistently use `inboxId` instead of `peer`
2. Kept the `peer: inboxId` mapping in the `getConversationByPeerByAccount` call since that function still expects a `peer` parameter
3. Updated query key generation and data access to use `inboxId`
4. Updated type definitions to use `inboxId` consistently

Note that the underlying `getConversationByPeerByAccount` function still expects a `peer` parameter, so we map `inboxId` to `peer` when calling it. You may want to update that function separately if needed.

---



---

