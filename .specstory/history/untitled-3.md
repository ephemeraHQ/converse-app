## SpecStory

## Untitled (2/3/2025, 10:17:15 AM)

_**User**_

fix

---

_**Assistant**_

I'll help fix the issues in the code. The main problems are:

1. Missing variables (`existingDmSearchResults`, `existingGroupMemberNameSearchResults`, `existingGroupNameSearchResults`)
2. Incorrect dependency array (`searchResults` doesn't exist)

Here's the corrected version:

```typescript:features/search/components/conversation-search-results-list.tsx
// ... existing code ...

  const sections = useMemo(() => {
    // Extract and organize search results
    const { dmResults, groupMemberResults, groupNameResults } = 
      existingConversationMembershipSearchResults?.reduce((acc, result) => {
        if (result.type === "dm") {
          acc.dmResults.push(result.data);
        } else if (result.type === "group-member") {
          acc.groupMemberResults.push(result.data);
        } else if (result.type === "group-name") {
          acc.groupNameResults.push(result.data);
        }
        return acc;
      }, { dmResults: [], groupMemberResults: [], groupNameResults: [] }) ?? 
      { dmResults: [], groupMemberResults: [], groupNameResults: [] };

    const sections: SearchSection[] = [];

    // Recent DMs
    const existingDmSearchResultsToShow = dmResults.slice(0, MAX_INITIAL_RESULTS);
    if (existingDmSearchResultsToShow.length > 0) {
      sections.push({
        title: "Recent Chats",
        data: existingDmSearchResultsToShow,
      });
    }

    // Groups with matching member names
    const existingGroupMemberNameSearchResultsToShow = 
      groupMemberResults.slice(0, MAX_INITIAL_RESULTS);
    if (existingGroupMemberNameSearchResultsToShow.length > 0) {
      sections.push({
        title: "Groups with matching members",
        data: existingGroupMemberNameSearchResultsToShow,
      });
    }

    // Groups with matching names
    const existingGroupNameSearchResultsToShow = 
      groupNameResults.slice(0, MAX_INITIAL_RESULTS);
    if (existingGroupNameSearchResultsToShow.length > 0) {
      sections.push({
        title: "Groups with matching names",
        data: existingGroupNameSearchResultsToShow,
      });
    }

    // Remaining DMs
    const remainingDmSearchResults = dmResults.slice(MAX_INITIAL_RESULTS);
    if (remainingDmSearchResults.length > 0) {
      sections.push({
        title: "Other Matching Chats",
        data: remainingDmSearchResults,
      });
    }

    // Other results
    if (convosSearchResults.length > 0) {
      sections.push({
        title: "Other Results",
        data: convosSearchResults,
      });
    }

    // Remaining group results with matching members
    const remainingGroupMemberResults = 
      groupMemberResults.slice(MAX_INITIAL_RESULTS);
    if (remainingGroupMemberResults.length > 0) {
      sections.push({
        title: "Other Groups with matching members",
        data: remainingGroupMemberResults,
      });
    }

    // Remaining group results with matching names
    const remainingGroupNameResults = 
      groupNameResults.slice(MAX_INITIAL_RESULTS);
    if (remainingGroupNameResults.length > 0) {
      sections.push({
        title: "Other Groups with matching names",
        data: remainingGroupNameResults,
      });
    }

    return sections;
  }, [existingConversationMembershipSearchResults, convosSearchResults]);

// ... existing code ...
```

The main changes:
1. Added a reducer to organize the search results from `existingConversationMembershipSearchResults` into separate arrays for DMs, group members, and group names
2. Updated variable names to use the organized results
3. Fixed the dependency array to use the correct variables
4. Added null coalescing operator to handle undefined search results

The code now properly processes the search results from the query and organizes them into appropriate sections for display.

---



---

