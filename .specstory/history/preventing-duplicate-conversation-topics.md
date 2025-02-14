## SpecStory

## Preventing Duplicate Conversation Topics (2/7/2025, 10:35:06 AM)

_**User**_

i think it might be fine but can you make sure we're not showing duplicates conversationTopic in the listData

---

_**Assistant**_

I'll help check for duplicates in the listData. Looking at the code, there's a potential for duplicate conversation topics between DMs and groups. While there is some deduplication with `uniqueGroupNameMatches`, we should make it more robust.

Here's how we can improve the code:

```typescript:features/conversation/conversation-create/components/conversation-create-search-results-list.tsx
// ... existing code ...

const listData = useMemo(() => {
    const items: SearchResultItem[] = [];
    const seenTopics = new Set<ConversationTopic>();

    // Wait until we finish loading both existing and searched results
    if (!searchConvosUsersData) {
      return items;
    }

    // If we have selected users, only show profiles
    if (selectedSearchUserInboxIds.length > 0) {
      return searchConvosUsersData?.inboxIds.map((inboxId) => ({
        type: "profile" as const,
        inboxId,
      }));
    }

    // Helper to add items while preventing duplicates
    const addUniqueTopics = (
      topics: ConversationTopic[],
      type: "dm" | "group",
      limit = MAX_INITIAL_RESULTS
    ) => {
      const newItems: SearchResultItem[] = [];
      for (const topic of topics) {
        if (newItems.length >= limit) break;
        if (!seenTopics.has(topic)) {
          seenTopics.add(topic);
          newItems.push({
            type,
            conversationTopic: topic,
          });
        }
      }
      return newItems;
    };

    // 1. Add DMs first
    items.push(...addUniqueTopics(existingDmTopics, "dm"));

    // 2. Add groups where member names match the search query
    items.push(...addUniqueTopics(existingGroupsByMemberNameTopics, "group"));

    // 3. Add groups where group names match the search query
    items.push(...addUniqueTopics(existingGroupsByGroupNameTopics, "group"));

    // 4. Add user profiles that aren't already in DMs
    const profilesNotInDms = searchConvosUsersData?.inboxIds
      .map((inboxId) => ({
        type: "profile" as const,
        inboxId,
      }))
      .filter((item) => {
        // Skip if the profile is already in a DM conversation
        return !existingDmTopics.some((topic) => {
          const members = getGroupMembersQueryData({
            account: getCurrentAccount()!,
            topic,
          });
          const peerInboxId = getDmPeerInboxIdQueryData({
            account: getCurrentAccount()!,
            topic,
          });

          return (
            peerInboxId === item.inboxId ||
            members?.ids.some((inboxId) => inboxId === item.inboxId)
          );
        });
      });

    items.push(...(profilesNotInDms ?? []));

    return items;
  }, [
    existingDmTopics,
    existingGroupsByMemberNameTopics,
    existingGroupsByGroupNameTopics,
    searchConvosUsersData,
    selectedSearchUserInboxIds,
  ]);

// ... rest of the code ...
```

The main changes are:

1. Added a `seenTopics` Set to track which conversation topics we've already added
2. Created a helper function `addUniqueTopics` that ensures we don't add duplicate topics while respecting the MAX_INITIAL_RESULTS limit
3. Removed the explicit filtering of `uniqueGroupNameMatches` since the deduplication is now handled by the Set
4. The logic for profiles remains the same since they use inboxIds which are already unique

This change ensures that no conversation topic will appear more than once in the list, while maintaining the desired order of DMs first, then groups by member names, then groups by group names, and finally profiles.

---

_**User**_

i don't like that... also don'T forget to keep the slice logic! It's brecause i want like to show first 3 existing DMs, then etc...

---

_**Assistant**_

Ah, you're right! Let's maintain the original slicing logic while just ensuring no duplicates between the different types. Here's a better approach:

```typescript:features/conversation/conversation-create/components/conversation-create-search-results-list.tsx
const listData = useMemo(() => {
    const items: SearchResultItem[] = [];
    const seenTopics = new Set<ConversationTopic>();

    // Wait until we finish loading both existing and searched results
    if (!searchConvosUsersData) {
      return items;
    }

    // If we have selected users, only show profiles
    if (selectedSearchUserInboxIds.length > 0) {
      return searchConvosUsersData?.inboxIds.map((inboxId) => ({
        type: "profile" as const,
        inboxId,
      }));
    }

    // 1. Add DMs first
    const dmItems = existingDmTopics
      .filter((topic) => !seenTopics.has(topic))
      .slice(0, MAX_INITIAL_RESULTS)
      .map((conversationTopic) => {
        seenTopics.add(conversationTopic);
        return {
          type: "dm" as const,
          conversationTopic,
        };
      });
    items.push(...dmItems);

    // 2. Add groups where member names match the search query
    const memberNameGroupItems = existingGroupsByMemberNameTopics
      .filter((topic) => !seenTopics.has(topic))
      .slice(0, MAX_INITIAL_RESULTS)
      .map((conversationTopic) => {
        seenTopics.add(conversationTopic);
        return {
          type: "group" as const,
          conversationTopic,
        };
      });
    items.push(...memberNameGroupItems);

    // 3. Add groups where group names match the search query
    const groupNameItems = existingGroupsByGroupNameTopics
      .filter((topic) => !seenTopics.has(topic))
      .slice(0, MAX_INITIAL_RESULTS)
      .map((conversationTopic) => {
        seenTopics.add(conversationTopic);
        return {
          type: "group" as const,
          conversationTopic,
        };
      });
    items.push(...groupNameItems);

    // 4. Add user profiles that aren't already in DMs
    const profilesNotInDms = searchConvosUsersData?.inboxIds
      .map((inboxId) => ({
        type: "profile" as const,
        inboxId,
      }))
      .filter((item) => {
        // Skip if the profile is already in a DM conversation
        return !existingDmTopics.some((topic) => {
          const members = getGroupMembersQueryData({
            account: getCurrentAccount()!,
            topic,
          });
          const peerInboxId = getDmPeerInboxIdQueryData({
            account: getCurrentAccount()!,
            topic,
          });

          return (
            peerInboxId === item.inboxId ||
            members?.ids.some((inboxId) => inboxId === item.inboxId)
          );
        });
      });

    items.push(...(profilesNotInDms ?? []));

    return items;
  }, [
    existingDmTopics,
    existingGroupsByMemberNameTopics,
    existingGroupsByGroupNameTopics,
    searchConvosUsersData,
    selectedSearchUserInboxIds,
  ]);
```

This version:
1. Maintains the original slicing logic to show MAX_INITIAL_RESULTS items for each type
2. Uses seenTopics to prevent duplicates between different types
3. Keeps the same order: DMs first, then groups by member names, then groups by group names, and finally profiles
4. Is more straightforward to read and understand than the previous suggestion

---

_**User**_

maybe what w ecould do is just at the end do a unique filtering on the whole list data to make sure there's no duplicates?? I want something clean without too much lines of codes...

---

_**Assistant**_

Ah yes, that's a much cleaner approach! Let's simplify the code by doing the deduplication at the end:

```typescript:features/conversation/conversation-create/components/conversation-create-search-results-list.tsx
const listData = useMemo(() => {
    const items: SearchResultItem[] = [];

    // Wait until we finish loading both existing and searched results
    if (!searchConvosUsersData) {
      return items;
    }

    // If we have selected users, only show profiles
    if (selectedSearchUserInboxIds.length > 0) {
      return searchConvosUsersData?.inboxIds.map((inboxId) => ({
        type: "profile" as const,
        inboxId,
      }));
    }

    // 1. Add DMs first
    items.push(
      ...existingDmTopics
        .map((conversationTopic) => ({
          type: "dm" as const,
          conversationTopic,
        }))
        .slice(0, MAX_INITIAL_RESULTS)
    );

    // 2. Add groups where member names match the search query
    items.push(
      ...existingGroupsByMemberNameTopics
        .map((conversationTopic) => ({
          type: "group" as const,
          conversationTopic,
        }))
        .slice(0, MAX_INITIAL_RESULTS)
    );

    // 3. Add groups where group names match the search query
    items.push(
      ...existingGroupsByGroupNameTopics
        .map((conversationTopic) => ({
          type: "group" as const,
          conversationTopic,
        }))
        .slice(0, MAX_INITIAL_RESULTS)
    );

    // 4. Add user profiles that aren't already in DMs
    const profilesNotInDms = searchConvosUsersData?.inboxIds
      .map((inboxId) => ({
        type: "profile" as const,
        inboxId,
      }))
      .filter((item) => {
        // Skip if the profile is already in a DM conversation
        return !existingDmTopics.some((topic) => {
          const members = getGroupMembersQueryData({
            account: getCurrentAccount()!,
            topic,
          });
          const peerInboxId = getDmPeerInboxIdQueryData({
            account: getCurrentAccount()!,
            topic,
          });

          return (
            peerInboxId === item.inboxId ||
            members?.ids.some((inboxId) => inboxId === item.inboxId)
          );
        });
      });

    items.push(...(profilesNotInDms ?? []));

    // Remove duplicates based on conversation topic
    return items.filter((item, index, self) => {
      if (item.type === "profile") return true;
      return (
        index ===
        self.findIndex(
          (t) =>
            t.type !== "profile" &&
            t.conversationTopic === item.conversationTopic
        )
      );
    });
  }, [
    existingDmTopics,
    existingGroupsByMemberNameTopics,
    existingGroupsByGroupNameTopics,
    searchConvosUsersData,
    selectedSearchUserInboxIds,
  ]);
```

This approach:
1. Keeps the original simple logic for adding items
2. Adds a single deduplication step at the end
3. Only deduplicates conversation topics (profiles are always unique)
4. Maintains the original ordering priority since it keeps the first occurrence of each topic
5. Is much more concise and easier to understand

---



---

