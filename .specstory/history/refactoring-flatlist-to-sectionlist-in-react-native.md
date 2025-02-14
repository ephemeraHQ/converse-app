## SpecStory

## Refactoring FlatList to SectionList in React Native (2/3/2025, 9:18:32 AM)

_**User**_

instead of flatList i want to use sectiobList @https://reactnative.dev/docs/sectionlist you'll need to refactor  "flattenedResults" 

---

_**Assistant**_

I'll help you refactor the code to use SectionList instead of FlatList. The main change will be restructuring the `flattenedResults` to match the SectionList data format, which requires an array of sections with `title` and `data` properties.

Here's how to modify the code:

```typescript:features/search/components/member-search-results.list.tsx
// ... existing imports ...

// Update the types to match SectionList requirements
type SearchResultItemType = "dm" | "group-member" | "group-name";

type SearchResultItem = {
  type: SearchResultItemType;
  data: IProfileSocials | any; // Use proper group type instead of any
};

type SearchSection = {
  title: string;
  data: SearchResultItem[];
};

export function SearchResultsList() {
  // ... existing code until flattenedResults ...

  const sections = useMemo(() => {
    const {
      existingDmSearchResults = [],
      existingGroupMemberNameSearchResults = [],
      existingGroupNameSearchResults = [],
      convosSearchResults = [],
    } = searchResults;

    const sections: SearchSection[] = [];

    // Recent DMs
    if (existingDmSearchResults.slice(0, MAX_INITIAL_RESULTS).length > 0) {
      sections.push({
        title: "Recent Chats",
        data: existingDmSearchResults
          .slice(0, MAX_INITIAL_RESULTS)
          .map((dm) => ({
            type: "dm" as const,
            data: dm,
          })),
      });
    }

    // Groups with matching member names
    if (existingGroupMemberNameSearchResults.slice(0, MAX_INITIAL_RESULTS).length > 0) {
      sections.push({
        title: "Groups with matching members",
        data: existingGroupMemberNameSearchResults
          .slice(0, MAX_INITIAL_RESULTS)
          .map((group) => ({
            type: "group-member" as const,
            data: group,
          })),
      });
    }

    // Groups with matching names
    if (existingGroupNameSearchResults.slice(0, MAX_INITIAL_RESULTS).length > 0) {
      sections.push({
        title: "Groups with matching names",
        data: existingGroupNameSearchResults
          .slice(0, MAX_INITIAL_RESULTS)
          .map((group) => ({
            type: "group-name" as const,
            data: group,
          })),
      });
    }

    // Remaining DMs
    if (existingDmSearchResults.slice(MAX_INITIAL_RESULTS).length > 0) {
      sections.push({
        title: "Other Matching Chats",
        data: existingDmSearchResults
          .slice(MAX_INITIAL_RESULTS)
          .map((dm) => ({
            type: "dm" as const,
            data: dm,
          })),
      });
    }

    // Other results
    if (convosSearchResults.length > 0) {
      sections.push({
        title: "Other Results",
        data: convosSearchResults.map((dm) => ({
          type: "dm" as const,
          data: dm,
        })),
      });
    }

    // Remaining group results with matching members
    if (existingGroupMemberNameSearchResults.slice(MAX_INITIAL_RESULTS).length > 0) {
      sections.push({
        title: "Other Groups with matching members",
        data: existingGroupMemberNameSearchResults
          .slice(MAX_INITIAL_RESULTS)
          .map((group) => ({
            type: "group-member" as const,
            data: group,
          })),
      });
    }

    // Remaining group results with matching names
    if (existingGroupNameSearchResults.slice(MAX_INITIAL_RESULTS).length > 0) {
      sections.push({
        title: "Other Groups with matching names",
        data: existingGroupNameSearchResults
          .slice(MAX_INITIAL_RESULTS)
          .map((group) => ({
            type: "group-name" as const,
            data: group,
          })),
      });
    }

    return sections;
  }, [searchResults]);

  // ... existing containerVisibleAV and containerAS code ...

  const renderItem = useCallback(({ item }: { item: SearchResultItem }) => {
    if (item.type === "dm") {
      return <DmSearchResult socials={item.data} />;
    }
    return <GroupSearchResult group={item.data} />;
  }, []);

  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: string } }) => (
      <SectionHeader title={section.title} />
    ),
    []
  );

  return (
    <AnimatedVStack
      style={[
        $globalStyles.absoluteFill,
        containerAS,
        {
          backgroundColor: theme.colors.background.surface,
        },
      ]}
    >
      <SectionList
        keyboardShouldPersistTaps="handled"
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={{
          paddingBottom: insets.bottom,
        }}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        stickySectionHeadersEnabled
      />
    </AnimatedVStack>
  );
}

// ... rest of the component code remains the same ...
```

Key changes made:
1. Added proper TypeScript types for the section data structure
2. Restructured `flattenedResults` into `sections` with the format required by SectionList
3. Replaced FlatList with SectionList
4. Added `renderItem` and `renderSectionHeader` as callbacks
5. Removed the section-header type from the item types since it's now handled by the SectionList component
6. Enabled sticky section headers by default

The SectionList will now render the search results with proper section headers that stick to the top as you scroll, providing a better user experience for navigating through different types of search results.

---



---

