## SpecStory

## Enhancing Conversation Hook for DMs and Groups (2/3/2025, 4:00:10 PM)

_**User**_

extra queryOptiosn

---

_**Assistant**_

I'll help you update the `useFindConversationByMembers` hook to properly handle both DM and group conversations. Based on the code style guide and the provided code snippets, here's how we can improve it:

```typescript:features/conversation-list/hooks/use-conversations-count.ts
// ... existing code ...

export const useFindConversationByMembers = (args: {
  inboxIds: InboxId[];
}) => {
  const { inboxIds } = args;
  const account = useCurrentAccount();

  const { data: conversations, isLoading: isConversationsLoading } = useQuery({
    ...getAllowedConsentConversationsQueryOptions({
      account: account!,
      caller: "useFindConversationByMembers",
    }),
  });

  const groups = conversations?.filter(isConversationGroup) || [];
  const dms = conversations?.filter(isConversationDm) || [];

  const groupMembersQueries = useQueries({
    queries: groups.map((conversation) => ({
      ...getGroupMembersQueryOptions({
        account: account!,
        topic: conversation.topic,
      }),
    })),
  });

  const dmPeerInboxIdQueries = useQueries({
    queries: dms.map((conversation) => ({
      ...getDmPeerInboxIdQueryOptions({
        account: account!,
        topic: conversation.topic,
        caller: "useFindConversationByMembers",
      }),
    })),
  });

  const existingConversation = conversations?.find((conversation) => {
    if (isConversationGroup(conversation)) {
      const groupMembers = getGroupMembersQueryData(account!, conversation.topic);
      if (!groupMembers) return false;

      const membersIdsSet = new Set(
        groupMembers.addresses.map((address) => address.toLowerCase())
      );

      return inboxIds.every((inboxId) => 
        membersIdsSet.has(inboxId.toLowerCase())
      );
    }

    if (isConversationDm(conversation)) {
      const peerInboxIdQuery = dmPeerInboxIdQueries[
        dms.findIndex((dm) => dm.topic === conversation.topic)
      ];
      
      return peerInboxIdQuery.data === inboxIds[0];
    }

    return false;
  });

  const isLoading = 
    isConversationsLoading || 
    groupMembersQueries.some((query) => query.isLoading) ||
    dmPeerInboxIdQueries.some((query) => query.isLoading);

  return { existingConversation, isLoading };
};
```

Key changes made:
1. Added proper handling for both DM and group conversations
2. Added `dmPeerInboxIdQueries` using the DM peer inbox ID query
3. Updated the `existingConversation` logic to check both group members and DM peer inbox IDs
4. Updated `isLoading` to include loading states from all queries
5. Simplified the return type to just include the existing conversation and loading state
6. Removed commented-out code
7. Added proper type for the input arguments

The hook now properly handles finding both group conversations and DM conversations based on the provided inbox IDs.

---



---

