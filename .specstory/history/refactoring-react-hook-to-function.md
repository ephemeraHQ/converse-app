## SpecStory

## Refactoring React Hook to Function (2/4/2025, 8:24:44 AM)

_**User**_

i dont want this in a hook, maybe just in a regular external function and we use liek reactCLient.fetchQueries ot something like that? and we remove the loading stuff

---

_**Assistant**_

I'll help you convert this hook into a regular function using React Query's client. We'll remove the loading states and use `fetchQuery` instead of hooks.

```typescript:features/conversation-list/utils/find-conversation-by-members.ts
import { isConversationDm } from "@/features/conversation/utils/is-conversation-dm";
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";
import { getAllowedConsentConversationsQueryOptions } from "@/queries/conversations-allowed-consent-query";
import { getDmPeerInboxIdQueryOptions } from "@/queries/use-dm-peer-inbox-id-query";
import { getGroupMembersQueryOptions } from "@/queries/useGroupMembersQuery";
import { isSameInboxId } from "@/utils/xmtpRN/xmtp-inbox-id/xmtp-inbox-id";
import { InboxId } from "@xmtp/react-native-sdk";
import { QueryClient } from "@tanstack/react-query";

export async function findConversationByMembers({ 
  inboxIds,
  account,
  queryClient
}: { 
  inboxIds: InboxId[];
  account: Account;
  queryClient: QueryClient;
}) {
  if (inboxIds.length === 0) {
    return undefined;
  }

  const conversations = await queryClient.fetchQuery(
    getAllowedConsentConversationsQueryOptions({
      account,
      caller: "findConversationByMembers",
    })
  );

  if (!conversations) {
    return undefined;
  }

  const groups = conversations.filter(isConversationGroup);
  const dms = conversations.filter(isConversationDm);

  // Fetch all group members data
  const groupMembersData = await Promise.all(
    groups.map(conversation => 
      queryClient.fetchQuery(
        getGroupMembersQueryOptions({
          account,
          topic: conversation.topic,
        })
      )
    )
  );

  // Check groups first
  const matchingGroup = groups.find((group, index) => {
    const memberIds = groupMembersData[index]?.ids;
    if (!memberIds) return false;
    return memberIds.every(memberId =>
      inboxIds.some(inboxId => isSameInboxId(memberId, inboxId))
    );
  });

  // If we found a group or if we're looking for multiple members, return the result
  if (matchingGroup || inboxIds.length > 1) {
    return matchingGroup;
  }

  // For DMs, only check if we have a single inboxId
  const dmPeerInboxIds = await Promise.all(
    dms.map(dm =>
      queryClient.fetchQuery(
        getDmPeerInboxIdQueryOptions({
          account,
          topic: dm.topic,
          caller: "findConversationByMembers",
        })
      )
    )
  );

  return dms.find((_, index) => {
    const peerInboxId = dmPeerInboxIds[index];
    return peerInboxId && isSameInboxId(inboxIds[0], peerInboxId);
  });
}
```

Key changes made:
1. Converted the hook to a regular async function
2. Removed all React hooks (useQuery, useQueries, useMemo)
3. Using `queryClient.fetchQuery` for data fetching
4. Removed loading states
5. Using Promise.all for parallel queries
6. Added QueryClient as a required parameter
7. Simplified the logic by removing state management
8. Moved the function to a utils file since it's no longer a hook

You can now call this function like:

```typescript
const conversation = await findConversationByMembers({ 
  inboxIds, 
  account, 
  queryClient 
});
```

---



---

