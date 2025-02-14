## SpecStory

## Handling Loading States in Pinned Conversations (1/8/2025, 12:43:59 PM)

_**User**_

I want that if we loaidng convesatins, reutnr null, but if we finish loading and we have conversations but no pinned, return null but if we finish loading and have no conversations, then we show the skeelton placeholder array

---

_**Assistant**_

I'll help you modify the PinnedConversations component to handle these loading states correctly. Here's how we should update the logic:

```typescript:features/conversation-list/PinnedConversations/PinnedConversations.tsx
// ... existing imports ...

export const ConversationListPinnedConversations = memo(
  function ConversationListPinnedConversations() {
    const { themed, theme } = useAppTheme();

    const pinnedConversationTopics = useConversationListStoreForCurrentAccount(
      (s) => s.pinnedConversationTopics
    );

    const currentAccount = useCurrentAccount();

    const { isLoading, data: conversations } = useConversationListQuery({
      account: currentAccount!,
      context: "PinnedConversations",
      queryOptions: {
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      },
    });

    // Return null if still loading
    if (isLoading) {
      return null;
    }

    // Return null if we have conversations but no pinned ones
    if (
      conversations?.length > 0 &&
      (!pinnedConversationTopics || pinnedConversationTopics.length === 0)
    ) {
      return null;
    }

    // Show skeleton if we have no conversations yet
    const shouldShowSkeleton = !conversations || conversations.length === 0;

    return (
      <AnimatedHStack
        style={themed($container)}
        layout={theme.animation.reanimatedLayoutSpringTransition}
      >
        {!shouldShowSkeleton ? (
          pinnedConversationTopics?.map((topic) => (
            <AnimatedCenter
              key={topic}
              layout={theme.animation.reanimatedLayoutSpringTransition}
              entering={theme.animation.reanimatedFadeInScaleIn({
                delay: 100,
              })}
            >
              <PinnedConversationWrapper topic={topic} />
            </AnimatedCenter>
          ))
        ) : (
          new Array(3)
            .fill(null)
            .map((_, index) => (
              <ConversationListAvatarSkeleton
                key={index}
                color={theme.colors.fill.minimal}
              />
            ))
        )}
      </AnimatedHStack>
    );
  }
);

// ... rest of the file remains the same ...
```

The key changes are:
1. First check if we're loading - return null if true
2. If we have conversations but no pinned ones - return null
3. Show skeleton placeholders only when we have no conversations yet (not loading, but conversations array is empty or undefined)
4. Otherwise show the pinned conversations if we have them

This maintains the same visual structure but handles the loading states according to the requirements.

---



---

