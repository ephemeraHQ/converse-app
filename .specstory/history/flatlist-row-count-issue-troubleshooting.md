## SpecStory

## FlatList Row Count Issue Troubleshooting (2/4/2025, 4:29:56 PM)

_**User**_

listData.lenght is 3 when i try but still i see like 10 rows, why is that? it's like a cache rpoblem with flatlist? like every time it renders it adds rows???

---

_**Assistant**_

Looking at your code, I can help explain why you might be seeing more rows than `listData.length` suggests. The issue isn't with FlatList caching, but rather with how the data is being accumulated in the `useMemo` hook.

Let's look at the relevant part of the code:

```typescript:features/search/components/conversation-search-results-list.tsx
// ... existing code ...
const listData = useMemo(() => {
    const items: SearchResultItem[] = [];

    // Early return if data isn't loaded
    if (!existingConversationMembershipSearchResults || !searchConvosUsersData) {
      return items;
    }

    const {
      existingDmTopics,
      existingGroupsByMemberNameTopics,
      existingGroupsByGroupNameTopics,
    } = existingConversationMembershipSearchResults;

    // Add DMs (up to 3)
    items.push(...existingDmTopics
      .map((conversationTopic) => ({
        type: "dm" as const,
        conversationTopic,
      }))
      .slice(0, MAX_INITIAL_RESULTS));

    // Add groups with matching member names (up to 3)
    items.push(...existingGroupsByMemberNameTopics
      .map((conversationTopic) => ({
        type: "group" as const,
        conversationTopic,
      }))
      .slice(0, MAX_INITIAL_RESULTS));

    // Add groups with matching names (up to 3)
    items.push(...existingGroupsByGroupNameTopics
      .map((conversationTopic) => ({
        type: "group" as const,
        conversationTopic,
      }))
      .slice(0, MAX_INITIAL_RESULTS));
// ... existing code ...
```

The issue is that you're adding up to 3 items from each category (DMs, groups by member names, groups by group names). So if each category has at least 3 items, you'll end up with:
- 3 DMs
- 3 groups with matching member names
- 3 groups with matching group names
- Plus any additional profile items

To fix this, you should either:

1. Apply the limit to the total number of items:

```typescript:features/search/components/conversation-search-results-list.tsx
const listData = useMemo(() => {
    const items: SearchResultItem[] = [];

    // Early return if data isn't loaded
    if (!existingConversationMembershipSearchResults || !searchConvosUsersData) {
      return items;
    }

    // If we have selected users, only show profiles
    if (selectedSearchUserInboxIds.length > 0) {
      return searchConvosUsersData?.inboxIds.map((inboxId) => ({
        type: "profile" as const,
        inboxId,
      }));
    }

    const {
      existingDmTopics,
      existingGroupsByMemberNameTopics,
      existingGroupsByGroupNameTopics,
    } = existingConversationMembershipSearchResults;

    // Combine all items without slicing
    const allItems = [
      ...existingDmTopics.map((conversationTopic) => ({
        type: "dm" as const,
        conversationTopic,
      })),
      ...existingGroupsByMemberNameTopics.map((conversationTopic) => ({
        type: "group" as const,
        conversationTopic,
      })),
      ...existingGroupsByGroupNameTopics.map((conversationTopic) => ({
        type: "group" as const,
        conversationTopic,
      })),
    ];

    // Take only the first MAX_INITIAL_RESULTS items
    items.push(...allItems.slice(0, MAX_INITIAL_RESULTS));

    // Add filtered profiles
    const profileItems = searchConvosUsersData?.inboxIds
      .map((inboxId) => ({
        type: "profile" as const,
        inboxId,
      }))
      .filter((item) => {
        return !existingDmTopics.some((topic) => {
          const members = getGroupMembersQueryData({
            account: getCurrentAccount()!,
            topic,
          });
          const peerInboxId = getDmPeerInboxIdQueryData({
            account: getCurrentAccount()!,
            topic,
            caller: "ConversationSearchResultsList",
          });
          return (
            peerInboxId === item.inboxId ||
            members?.ids.some((inboxId) => inboxId === item.inboxId)
          );
        });
      });

    items.push(...profileItems);

    return items;
}, [/* ... dependencies ... */]);
```

This change will ensure you only get a maximum of 3 items total from the conversations (DMs and groups combined), plus any matching profiles.

---

_**User**_

Nooo that's not thep robme.!!! listData.length is 3 . that's good. but then in the list I see like 9 items!!

---

_**Assistant**_

Ah, I understand now! If `listData.length` is 3 but you're seeing 9 items in the list, this suggests that the FlatList is rendering multiple times and possibly appending items instead of replacing them. 

Let's add a key to the FlatList to ensure it properly resets when the data changes:

```typescript:features/search/components/conversation-search-results-list.tsx
// ... existing code ...
return (
    <Container>
      <FlatList
        key={searchQuery} // Add this line to force FlatList reset when search changes
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={/* ... */}
        data={listData}
        renderItem={/* ... */}
        contentContainerStyle={/* ... */}
        keyExtractor={/* ... */}
      />
    </Container>
);
// ... existing code ...
```

Also, let's add some debug logging to verify the data being passed to FlatList:

```typescript:features/search/components/conversation-search-results-list.tsx
// ... existing code ...
const listData = useMemo(() => {
    const items: SearchResultItem[] = [];
    
    // ... existing logic ...

    logger.debug(`[ConversationSearchResultsList] Generated ${items.length} items for search: "${searchQuery}"`);
    return items;
}, [
    existingConversationMembershipSearchResults,
    searchConvosUsersData,
    selectedSearchUserInboxIds,
]);

// Add this debug log before the return
logger.debug(`[ConversationSearchResultsList] Rendering FlatList with ${listData.length} items`);

return (
    <Container>
      <FlatList
        // ... rest of the code
```

This should help identify if the issue is with data generation or rendering. If you're still seeing the issue, could you share what you see in the debug logs?

---

_**User**_

but why would I need the key=? 

---

_**Assistant**_

The `key={searchQuery}` prop on FlatList is actually important here. When you provide a new `key` value to a React component, React will completely unmount the old instance and create a new one, rather than trying to update the existing one.

In your case, without the `key`, the FlatList might be maintaining some internal state that's causing the rendering issues. By adding `key={searchQuery}`, you ensure that whenever the search query changes, the FlatList is completely recreated with a fresh state.

Here's a simple way to verify if this is the issue:

```typescript:features/search/components/conversation-search-results-list.tsx
// ... existing code ...
return (
    <Container>
      <FlatList
        // Remove the key prop temporarily and add this debug log
        onContentSizeChange={() => {
          logger.debug(
            `[ConversationSearchResultsList] FlatList content changed. Data length: ${listData.length}`
          );
        }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={/* ... */}
        data={listData}
        renderItem={/* ... */}
        // ... rest of props
      />
    </Container>
);
```

If you see the debug log firing multiple times with the same `listData.length`, it indicates that the FlatList is indeed maintaining some state that needs to be reset. In that case, adding back the `key={searchQuery}` prop would fix the issue by forcing a complete reset of the FlatList when the search query changes.

---

_**User**_

For the code present, we get this error:
```
Type '(OmitKeyof<UseQueryOptions<{ address?: string | undefined; ensNames?: { name: string; isPrimary: boolean; displayName?: string | undefined; avatar?: string | undefined; }[] | undefined; farcasterUsernames?: { ...; }[] | undefined; lensHandles?: { ...; }[] | undefined; unstoppableDomains?: { ...; }[] | undefined; use...' is not assignable to type 'readonly UseQueryOptionsForUseQueries<{ address?: string | undefined; ensNames?: { name: string; isPrimary: boolean; displayName?: string | undefined; avatar?: string | undefined; }[] | undefined; farcasterUsernames?: { ...; }[] | undefined; lensHandles?: { ...; }[] | undefined; unstoppableDomains?: { ...; }[] | und...'.
  Type 'undefined' is not assignable to type 'readonly UseQueryOptionsForUseQueries<{ address?: string | undefined; ensNames?: { name: string; isPrimary: boolean; displayName?: string | undefined; avatar?: string | undefined; }[] | undefined; farcasterUsernames?: { ...; }[] | undefined; lensHandles?: { ...; }[] | undefined; unstoppableDomains?: { ...; }[] | und...'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error occurs because `members?.ids` might be undefined. Here's the fix:

```typescript:components/group-avatar.tsx
// ... existing code ...
  const data = useQueries({
    queries: members?.ids?.map((inboxId) =>
      getInboxProfileSocialsQueryConfig({ inboxId, caller: "group-avatar" })
    ) ?? [],
  });
// ... existing code ...
```

This ensures that if `members` or `ids` is undefined, an empty array is provided instead, satisfying the type requirements of `useQueries`.

---

_**User**_

wtf why if i return String(index) now it works? it seem the keyextract with like dm- etc... fucks the layout

---

_**Assistant**_



Ah, I see what happened. The issue was in your `keyExtractor` function. You had a `return String(index)` followed by unreachable code:

```typescript:features/search/components/conversation-search-results-list.tsx
keyExtractor={(item, index) => {
  return String(index);  // This early return makes all code below unreachable
  if (item.type === "dm") {
    return `dm-${item.conversationTopic}`;
  }
  // ... rest of the code never runs
}}
```

The complex key generation with `dm-`, `group-`, etc. was likely causing layout issues. Using the simple index-based key (`String(index)`) works better because:

1. Each key is guaranteed to be unique in the current render
2. It's simpler and more consistent
3. Since your data is static within each render (from `useMemo`), using index as key is safe here

If you want to keep the more semantic keys, you could fix the original code by removing the early return:

```typescript:features/search/components/conversation-search-results-list.tsx
keyExtractor={(item) => {
  if (item.type === "dm") {
    return `dm-${item.conversationTopic}`;
  }
  if (item.type === "group") {
    return `group-${item.conversationTopic}`;
  }
  if (item.type === "profile") {
    return `profile-${item.inboxId}`;
  }
  const _ensureNever: never = item.type;
  throw new Error("Invalid item type");
}}
```

But since `String(index)` is working well, it's probably best to stick with that simpler solution.

---



---

