## SpecStory

## Resolving TypeScript SectionList Errors (2/3/2025, 10:26:22 AM)

_**User**_

For the code present, we get this error:
```
No overload matches this call.
  Overload 1 of 2, '(props: SectionListProps<ConversationTopic, SearchSection>): SectionList<ConversationTopic, SearchSection>', gave the following error.
    Type 'SearchSection[]' is not assignable to type 'readonly SectionListData<ConversationTopic, SearchSection>[]'.
      Type 'SearchSection' is not assignable to type 'SectionListData<ConversationTopic, SearchSection>'.
        Type 'SearchSection' is not assignable to type 'SectionBase<ConversationTopic, SearchSection>'.
          Types of property 'data' are incompatible.
            Type 'ConversationTopic[] | IProfileSocials[]' is not assignable to type 'readonly ConversationTopic[]'.
              Type 'IProfileSocials[]' is not assignable to type 'readonly ConversationTopic[]'.
                Type 'IProfileSocials' is not assignable to type 'ConversationTopic'.
                  Type 'IProfileSocials' is not assignable to type 'string'.
  Overload 2 of 2, '(props: SectionListProps<ConversationTopic, SearchSection>, context: any): SectionList<ConversationTopic, SearchSection>', gave the following error.
    Type 'SearchSection[]' is not assignable to type 'readonly SectionListData<ConversationTopic, SearchSection>[]'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error occurs because `SectionList` expects consistent data types within sections, but we're mixing `ConversationTopic` and `IProfileSocials`. Let's create a unified type for the items:

```typescript:features/search/components/conversation-search-results-list.tsx
// ... existing code ...

type SearchResultItem = {
  type: 'dm' | 'group';
  data: ConversationTopic;
} | {
  type: 'profile';
  data: IProfileSocials;
};

type SearchSection = {
  title: string;
  data: SearchResultItem[];
};

// ... existing code ...

// In the sections creation, wrap items with type information:
if (existingDmSearchResultsToShow.length > 0) {
  sections.push({
    title: "Recent Chats",
    data: existingDmSearchResultsToShow.map(topic => ({
      type: 'dm',
      data: topic,
    })),
  });
}

// Update renderItem to use the new type
renderItem={({ item }: { item: SearchResultItem }) => {
  if (item.type === "dm") {
    return <DmSearchResult conversationTopic={item.data} />;
  }
  if (item.type === "group") {
    return <GroupSearchResult conversationTopic={item.data} />;
  }
  return <ProfileSearchResult socials={item.data} />;
}}
```

This creates a discriminated union type for the items and ensures type safety throughout the section list.

---



---

