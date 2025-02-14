## SpecStory

## Refactoring Code for Cleaner Structure (2/4/2025, 10:31:42 AM)

_**User**_

how to make it cleaner, since we have 2 times 

---

_**Assistant**_

I'll help you clean up the repeated mapping pattern for search results. We can extract a helper function to handle the mapping of data to section items. Here's how we can improve it:

```typescript:features/search/components/conversation-search-results-list.tsx
// ... existing code ...

function mapToSectionItems(
  items: ConversationTopic[] | InboxId[],
  type: SearchResultItem["type"]
): SearchResultItem[] {
  return items.map((item) => ({
    type,
    data: item,
  }));
}

const sections = useMemo(() => {
  const sections: SearchSection[] = [];

  if (!existingConversationMembershipSearchResults || !searchConvosUsersData) {
    return sections;
  }

  // If we have selected users, only show "Other Results" section with profiles
  if (selectedSearchUserInboxIds.length > 0) {
    if (!searchConvosUsersData) {
      return sections;
    }

    sections.push({
      title: "Other Results",
      data: mapToSectionItems(searchConvosUsersData.inboxIds, "profile"),
    });

    return sections;
  }

  const {
    existingDmTopics,
    existingGroupsByMemberNameTopics,
    existingGroupsByGroupNameTopics,
  } = existingConversationMembershipSearchResults;

  // Define section configurations
  const sectionConfigs = [
    {
      title: "Recent Chats",
      items: existingDmTopics.slice(0, MAX_INITIAL_RESULTS),
      type: "dm" as const,
    },
    {
      title: "Groups with matching members",
      items: existingGroupsByMemberNameTopics.slice(0, MAX_INITIAL_RESULTS),
      type: "group" as const,
    },
    {
      title: "Groups with matching names",
      items: existingGroupsByGroupNameTopics.slice(0, MAX_INITIAL_RESULTS),
      type: "group" as const,
    },
    {
      title: "Convos Users",
      items: searchConvosUsersData.inboxIds,
      type: "profile" as const,
    },
    {
      title: "Other Matching Chats",
      items: existingDmTopics.slice(MAX_INITIAL_RESULTS),
      type: "dm" as const,
    },
    {
      title: "Other Groups with matching members",
      items: existingGroupsByMemberNameTopics.slice(MAX_INITIAL_RESULTS),
      type: "group" as const,
    },
    {
      title: "Other Groups with matching names",
      items: existingGroupsByGroupNameTopics.slice(MAX_INITIAL_RESULTS),
      type: "group" as const,
    },
  ];

  // Add non-empty sections
  sectionConfigs.forEach(({ title, items, type }) => {
    if (items.length > 0) {
      sections.push({
        title,
        data: mapToSectionItems(items, type),
      });
    }
  });

  return sections;
}, [
  existingConversationMembershipSearchResults,
  searchConvosUsersData,
  selectedSearchUserInboxIds,
]);

// ... existing code ...
```

This refactoring:

1. Creates a `mapToSectionItems` helper function to handle the repeated mapping pattern
2. Uses a `sectionConfigs` array to define all possible sections in a more maintainable way
3. Processes sections in a single loop instead of separate blocks
4. Maintains the same functionality while reducing code duplication
5. Makes it easier to add or modify sections in the future

The code is now more maintainable and follows the DRY (Don't Repeat Yourself) principle while preserving all the existing functionality.

---



---

