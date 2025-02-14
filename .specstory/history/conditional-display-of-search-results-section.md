## SpecStory

## Conditional Display of Search Results Section (2/3/2025, 4:19:11 PM)

_**User**_

if we have at least one "selectedSearchUserInboxIds", in the sectionList we only show 1 section whichi will be "other results" which will be profiles row

---

_**Assistant**_

I'll help you modify the code to show only the "Other Results" section when there are selected search user inbox IDs. Here's the change needed:

```typescript:features/search/components/conversation-search-results-list.tsx
// ... existing code ...

const sections = useMemo(() => {
  const sections: SearchSection[] = [];

  if (!existingConversationMembershipSearchResults) {
    return sections;
  }

  if (!convosSearchResults) {
    return sections;
  }

  // If we have selected users, only show "Other Results" section with profiles
  if (selectedSearchUserInboxIds.length > 0) {
    if (convosSearchResults.length > 0) {
      sections.push({
        title: "Other Results",
        data: convosSearchResults.map((inboxId) => ({
          type: "profile",
          data: inboxId,
        })),
      });
    }
    return sections;
  }

  const {
    existingDmTopics,
    existingGroupsByMemberNameTopics,
    existingGroupsByGroupNameTopics,
  } = existingConversationMembershipSearchResults;

  // ... existing code for other sections ...

  return sections;
}, [existingConversationMembershipSearchResults, convosSearchResults, selectedSearchUserInboxIds]);

// ... existing code ...
```

The key change is adding a condition to check `selectedSearchUserInboxIds.length > 0` early in the sections creation logic. When this condition is true, we only add the "Other Results" section with profiles and return immediately, skipping all other section creation logic. I also added `selectedSearchUserInboxIds` to the dependency array of the useMemo hook since we're now using it in the calculation.

---



---

