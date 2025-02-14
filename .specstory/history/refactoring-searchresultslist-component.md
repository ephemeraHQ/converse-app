## SpecStory

## Refactoring SearchResultsList Component (1/31/2025, 1:48:28 PM)

_**User**_

ok fix this, I want component instead of "render" functins like "renderDmSection" . 

I also want to pass all the results to data and then in renderItem do some early return to know which component to render. 

Remember the order at which we display stuff now because the data array will need to have same order you can [... ] all the stuff



---

_**Assistant**_

I'll help you refactor the SearchResultsList component to use a more component-based approach and flatten the data structure. Here's how we can improve it:

```typescript:features/search/components/member-search-results.list.tsx
// ... existing code ...

type SearchResultItem = {
  type: 'dm' | 'group-member' | 'group-name';
  title?: string; // Section title
  data: IProfileSocials | any; // Use proper group type instead of any
  isRecent?: boolean;
}

export function SearchResultsList() {
  const { themed } = useAppTheme();

  const searchUsersQuery = useConversationStoreContext(
    (state) => state.searchTextValue
  );

  const selectedAddresses: string[] = [];
  const currentUserAddress = useCurrentAccount()!;

  const { searchResults } = useSearchUsersQuery({
    searchQuery: searchUsersQuery,
    addressesToOmit: [...selectedAddresses, currentUserAddress],
  });

  const {
    existingDmSearchResults = [],
    existingGroupMemberNameSearchResults = [],
    existingGroupNameSearchResults = [],
    convosSearchResults = [],
  } = searchResults;

  // Flatten and order all results
  const flattenedResults: SearchResultItem[] = [
    // Recent DMs
    ...existingDmSearchResults.slice(0, MAX_INITIAL_RESULTS).map(dm => ({
      type: 'dm',
      title: 'Recent Chats',
      data: dm,
      isRecent: true
    })),
    // Groups with matching member names
    ...existingGroupMemberNameSearchResults.slice(0, MAX_INITIAL_RESULTS).map(group => ({
      type: 'group-member',
      title: 'Groups with matching members',
      data: group,
      isRecent: true
    })),
    // Groups with matching names
    ...existingGroupNameSearchResults.slice(0, MAX_INITIAL_RESULTS).map(group => ({
      type: 'group-name',
      title: 'Groups with matching names',
      data: group,
      isRecent: true
    })),
    // Remaining DMs
    ...existingDmSearchResults.slice(MAX_INITIAL_RESULTS).map(dm => ({
      type: 'dm',
      title: 'Other Matching Chats',
      data: dm
    })),
    // Other results
    ...convosSearchResults.map(dm => ({
      type: 'dm',
      title: 'Other Results',
      data: dm
    })),
    // Remaining group results
    ...existingGroupMemberNameSearchResults.slice(MAX_INITIAL_RESULTS).map(group => ({
      type: 'group-member',
      title: 'Other Groups with matching members',
      data: group
    })),
    ...existingGroupNameSearchResults.slice(MAX_INITIAL_RESULTS).map(group => ({
      type: 'group-name',
      title: 'Other Groups with matching names',
      data: group
    }))
  ];

  return (
    <FlatList
      keyboardShouldPersistTaps="handled"
      style={themed(searchResultsStyles.$container)}
      data={flattenedResults}
      renderItem={({ item }) => (
        <SearchResultItem item={item} />
      )}
      keyExtractor={(item, index) => `${item.type}-${index}`}
    />
  );
}

function SearchResultItem({ item }: { item: SearchResultItem }) {
  const { themed } = useAppTheme();
  
  // Early return for section headers
  if (item.title) {
    return (
      <View style={themed(searchResultsStyles.$sectionHeader)}>
        <Text preset="formLabel" style={themed(searchResultsStyles.$sectionTitle)}>
          {item.title}
        </Text>
      </View>
    );
  }

  if (item.type === 'dm') {
    return (
      <UserSearchResultListItem
        address={item.data.address || ""}
        socials={item.data}
        handleUserSearchResultPress={handleSearchResultItemPress}
      />
    );
  }

  // Group results (both member and name matches)
  return (
    <GroupSearchResultItem
      group={item.data}
      onPress={() => handleGroupPress(item.data.groupId)}
    />
  );
}

// ... existing GroupSearchResultItem component ...
```

Key changes made:

1. Removed the render* functions and replaced them with a single `SearchResultItem` component
2. Created a `SearchResultItem` type to properly type our flattened data structure
3. Flattened all the results into a single array while maintaining the original display order
4. Used early returns in the `SearchResultItem` component to determine which component to render
5. Simplified the `FlatList` implementation to use a single `renderItem` function
6. Maintained the section headers by including them in the data structure

The code is now more maintainable and follows a more component-based approach while preserving the original functionality and display order.

Note: You'll need to ensure that `handleSearchResultItemPress` and `handleGroupPress` are properly defined in the scope where they're used. They were referenced in the original code but not shown in the snippet.

---

_**User**_

i want the if to be in the renderItem and then to render the componet .Because in each componet i will have function , hooks ,etc..

---

_**Assistant**_

Ah, I understand. You want to keep the component logic separate and handle the routing in the renderItem. Here's the improved version:

```typescript:features/search/components/member-search-results.list.tsx
// ... existing imports ...

type SearchResultItem = {
  type: 'section-header' | 'dm' | 'group-member' | 'group-name';
  title?: string;
  data: IProfileSocials | any; // Use proper group type instead of any
  isRecent?: boolean;
}

export function SearchResultsList() {
  const { themed } = useAppTheme();

  const searchUsersQuery = useConversationStoreContext(
    (state) => state.searchTextValue
  );

  const selectedAddresses: string[] = [];
  const currentUserAddress = useCurrentAccount()!;

  const { searchResults } = useSearchUsersQuery({
    searchQuery: searchUsersQuery,
    addressesToOmit: [...selectedAddresses, currentUserAddress],
  });

  const {
    existingDmSearchResults = [],
    existingGroupMemberNameSearchResults = [],
    existingGroupNameSearchResults = [],
    convosSearchResults = [],
  } = searchResults;

  // Flatten and order all results
  const flattenedResults: SearchResultItem[] = [
    // Recent DMs
    { type: 'section-header', title: 'Recent Chats', data: {} },
    ...existingDmSearchResults.slice(0, MAX_INITIAL_RESULTS).map(dm => ({
      type: 'dm',
      data: dm,
      isRecent: true
    })),
    // Groups with matching member names
    { type: 'section-header', title: 'Groups with matching members', data: {} },
    ...existingGroupMemberNameSearchResults.slice(0, MAX_INITIAL_RESULTS).map(group => ({
      type: 'group-member',
      data: group,
      isRecent: true
    })),
    // Groups with matching names
    { type: 'section-header', title: 'Groups with matching names', data: {} },
    ...existingGroupNameSearchResults.slice(0, MAX_INITIAL_RESULTS).map(group => ({
      type: 'group-name',
      data: group,
      isRecent: true
    })),
    // Remaining DMs
    { type: 'section-header', title: 'Other Matching Chats', data: {} },
    ...existingDmSearchResults.slice(MAX_INITIAL_RESULTS).map(dm => ({
      type: 'dm',
      data: dm
    })),
    // Other results
    { type: 'section-header', title: 'Other Results', data: {} },
    ...convosSearchResults.map(dm => ({
      type: 'dm',
      data: dm
    })),
    // Remaining group results
    { type: 'section-header', title: 'Other Groups with matching members', data: {} },
    ...existingGroupMemberNameSearchResults.slice(MAX_INITIAL_RESULTS).map(group => ({
      type: 'group-member',
      data: group
    })),
    { type: 'section-header', title: 'Other Groups with matching names', data: {} },
    ...existingGroupNameSearchResults.slice(MAX_INITIAL_RESULTS).map(group => ({
      type: 'group-name',
      data: group
    }))
  ];

  return (
    <FlatList
      keyboardShouldPersistTaps="handled"
      style={themed(searchResultsStyles.$container)}
      data={flattenedResults}
      renderItem={({ item }) => {
        if (item.type === 'section-header') {
          return <SectionHeader title={item.title!} />;
        }

        if (item.type === 'dm') {
          return <DmSearchResult socials={item.data} />;
        }

        // Both group-member and group-name types use the same component
        return <GroupSearchResult group={item.data} />;
      }}
      keyExtractor={(item, index) => `${item.type}-${index}`}
    />
  );
}

function SectionHeader({ title }: { title: string }) {
  const { themed } = useAppTheme();
  
  return (
    <View style={themed(searchResultsStyles.$sectionHeader)}>
      <Text preset="formLabel" style={themed(searchResultsStyles.$sectionTitle)}>
        {title}
      </Text>
    </View>
  );
}

function DmSearchResult({ socials }: { socials: IProfileSocials }) {
  return (
    <UserSearchResultListItem
      address={socials.address || ""}
      socials={socials}
      handleUserSearchResultPress={handleSearchResultItemPress}
    />
  );
}

function GroupSearchResult({ group }: { group: GroupSearchResultItemProps['group'] }) {
  const { theme, themed } = useAppTheme();
  const { groupName, groupImageUri, firstThreeMemberNames } = group;

  return (
    <Pressable onPress={() => handleGroupPress(group.groupId)}>
      <View style={themed(searchResultsStyles.$groupContainer)}>
        <Avatar
          uri={groupImageUri}
          size={theme.avatarSize.md}
          style={themed(searchResultsStyles.$avatar)}
          name={groupName}
        />
        <View style={themed(searchResultsStyles.$groupTextContainer)}>
          <Text
            preset="bodyBold"
            style={themed(searchResultsStyles.$primaryText)}
            numberOfLines={1}
          >
            {groupName}
          </Text>
          <Text
            preset="formLabel"
            style={themed(searchResultsStyles.$secondaryText)}
            numberOfLines={1}
          >
            {firstThreeMemberNames.join(", ")}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
```

Key changes:
1. Added section headers directly in the data array
2. Moved the routing logic to the `renderItem` function
3. Split into separate components that each handle their own logic
4. Added 'section-header' as a distinct type in the SearchResultItem type
5. Each component can now have its own hooks, functions, and logic independently

Note: You'll still need to handle `handleSearchResultItemPress` and `handleGroupPress` appropriately in your component scope.

---



---

