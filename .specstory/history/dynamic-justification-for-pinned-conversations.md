## SpecStory

## Dynamic Justification for Pinned Conversations (1/8/2025, 1:22:21 PM)

_**User**_

I want justifyCOntent space-between but only if we have 3 (number of columns) otherwise we center

---

_**Assistant**_

I'll help modify the `PinnedConversations.tsx` file to adjust the justifyContent based on the number of items. Here's how we can update it:

```typescript:features/conversation-list/PinnedConversations/PinnedConversations.tsx
// ... existing code ...

export const ConversationListPinnedConversations = memo(
  function ConversationListPinnedConversations() {
    const { themed, theme } = useAppTheme();

    const pinnedConversationTopics = useConversationListStoreForCurrentAccount(
      (s) => s.pinnedConversationTopics
    );

    // Get the number of pinned conversations
    const pinnedCount = pinnedConversationTopics?.length ?? 0;

    // ... existing loading and null checks ...

    return (
      <AnimatedHStack
        style={[
          themed($container),
          // Override justifyContent based on count
          { justifyContent: pinnedCount === 3 ? 'space-between' : 'center' }
        ]}
        layout={theme.animation.reanimatedLayoutSpringTransition}
      >
        {pinnedConversationTopics?.map((topic) => (
          <AnimatedCenter
            key={topic}
            layout={theme.animation.reanimatedLayoutSpringTransition}
            entering={theme.animation.reanimatedFadeInScaleIn({
              delay: 100,
            })}
          >
            <PinnedConversationWrapper topic={topic} />
          </AnimatedCenter>
        ))}
      </AnimatedHStack>
    );
  }
);

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexWrap: "wrap",
  rowGap: spacing.lg,
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.lg,
  // Remove justifyContent from here since we're setting it dynamically
});

// ... rest of the code ...
```

The changes:
1. Added a `pinnedCount` variable to track the number of pinned conversations
2. Modified the `AnimatedHStack` style to conditionally set `justifyContent` based on the count
3. Removed the static `justifyContent` from the `$container` styles

Now the pinned conversations will be:
- Centered when there are 1 or 2 items
- Space-between when there are exactly 3 items

---



---

