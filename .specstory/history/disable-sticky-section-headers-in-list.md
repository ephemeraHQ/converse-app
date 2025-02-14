## SpecStory

## Disable Sticky Section Headers in List (2/3/2025, 9:24:19 AM)

_**User**_

i don't want the section header to be sticky

---

_**Assistant**_

I'll help you modify the `SearchResultsList` component to remove the sticky header behavior. Here are the necessary changes:

```typescript:features/search/components/member-search-results.list.tsx
// ... existing code ...

export function SearchResultsList() {
  // ... existing code ...

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
        stickyHeaderHiddenOnScroll={false}
        keyboardShouldPersistTaps="handled"
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={{
          paddingBottom: insets.bottom,
        }}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        stickySectionHeadersEnabled={false}  {/* Changed this line */}
      />
    </AnimatedVStack>
  );
}

// ... existing code ...
```

I've set `stickySectionHeadersEnabled={false}` on the SectionList component to prevent the section headers from sticking to the top while scrolling.

---



---

