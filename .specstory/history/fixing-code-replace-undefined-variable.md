## SpecStory

## Fixing Code: Replace Undefined Variable (2/3/2025, 4:06:16 PM)

_**User**_

fix , we don't use membersToSearch

---

_**Assistant**_

I notice that `membersToSearch` is used in the code but it's not defined anywhere. Since the hook takes `inboxIds` as an argument, we should use that instead. Here's the fix:

```typescript:features/conversation-list/hooks/use-conversations-count.ts
// ... existing code ...
  const existingConversation = useMemo(() => {
    if (!conversations) {
      return undefined;
    }

    return conversations.find((conversation) => {
      // Check group conversations
      if (isConversationGroup(conversation)) {
        const groupMembers = getGroupMembersQueryData(
          account!,
          conversation.topic
        );
        if (!groupMembers) return false;

        const membersIdsSet = new Set(
          groupMembers.addresses.map((address) => address.toLowerCase())
        );

        return inboxIds.every((inboxId) =>
          membersIdsSet.has(inboxId.toLowerCase())
        );
      }

      // Check DM conversations
      if (isConversationDm(conversation) && inboxIds.length === 1) {
        const peerInboxId = getQueryClient().getQueryData(
          dmPeerInboxIdQueryKey(account!, conversation.topic)
        );

        return peerInboxId && isSameInboxId(inboxIds[0], peerInboxId);
      }

      return false;
    });
  }, [conversations, account, inboxIds]);
// ... existing code ...
```

Changes made:
1. Replaced `membersToSearch` with `inboxIds` in the group conversations check
2. Removed the unnecessary `membersToSearch.length === 1` check in the DM conversations condition since we already check `inboxIds.length === 1`

The code now properly uses the `inboxIds` parameter that's passed to the hook instead of the undefined `membersToSearch` variable.

---

_**User**_

why taking from groupMembersQueryData and not from the dmPeerInboxqueries and groupMembersQueries itself? I guess it's because we can't access with index? But we have the dms and groups so we can just check how many inboxIds we have. if we have only 1 check dms and groups, if more than 1 then check only groups, if 0 then early return undefined

---

_**Assistant**_

You make a good point! We can optimize this by using the queries we already have and implement the logic you described. Here's the improved version:

```typescript:features/conversation-list/hooks/use-conversations-count.ts
// ... existing code ...
  const existingConversation = useMemo(() => {
    if (!conversations || inboxIds.length === 0) {
      return undefined;
    }

    // If more than 1 inboxId, only check groups
    if (inboxIds.length > 1) {
      return groups.find((group, index) => {
        const groupMembersQuery = groupMembersQueries[index];
        const members = groupMembersQuery.data?.addresses;
        if (!members) return false;

        const membersIdsSet = new Set(
          members.map((address) => address.toLowerCase())
        );

        return inboxIds.every((inboxId) =>
          membersIdsSet.has(inboxId.toLowerCase())
        );
      });
    }

    // For single inboxId, check both DMs and groups
    const matchingDm = dms.find((dm, index) => {
      const peerInboxIdQuery = dmPeerInboxIdQueries[index];
      const peerInboxId = peerInboxIdQuery.data;
      return peerInboxId && isSameInboxId(inboxIds[0], peerInboxId);
    });

    if (matchingDm) return matchingDm;

    // Check groups as fallback for single inboxId
    return groups.find((group, index) => {
      const groupMembersQuery = groupMembersQueries[index];
      const members = groupMembersQuery.data?.addresses;
      if (!members) return false;

      const membersIdsSet = new Set(
        members.map((address) => address.toLowerCase())
      );

      return membersIdsSet.has(inboxIds[0].toLowerCase());
    });
  }, [conversations, groups, dms, groupMembersQueries, dmPeerInboxIdQueries, inboxIds]);
// ... existing code ...
```

Changes made:
1. Added early return if `inboxIds` is empty
2. Split the logic based on number of `inboxIds`
3. Used the parallel queries we already have (`groupMembersQueries` and `dmPeerInboxIdQueries`) instead of making separate query calls
4. For single `inboxId`, we check DMs first and then groups as fallback
5. For multiple `inboxIds`, we only check groups
6. Updated the dependency array to include all used variables

This approach is more efficient because:
- It uses the already fetched data from parallel queries
- It has better branching logic based on the number of inboxIds
- It avoids unnecessary checks (e.g., not checking DMs when we have multiple inboxIds)

---



---

