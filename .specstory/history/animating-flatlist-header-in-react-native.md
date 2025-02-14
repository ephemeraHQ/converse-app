## SpecStory

## Animating FlatList Header in React Native (1/17/2025, 9:45:36 AM)

_**User**_

ConversationList is a AnimatedFlatlist, if I place the ListHeader in ListHeaderComponent it doens't animate the list when ListHeader change height. But when i put it out, it does, possible to have it in ListHeaderComponent but still animate the list?

---

_**Assistant**_

Yes, it's possible to maintain the animation while using `ListHeaderComponent`. The key is to ensure the FlatList can properly handle layout changes. Here's how you can modify the code:

```typescript:features/conversation-list/conversation-list.screen.tsx
// ... existing code ...
        <ConversationList
          conversations={conversations ?? []}
          scrollEnabled={conversations && conversations?.length > 0}
          ListEmptyComponent={<ConversationListEmpty />}
          ListHeaderComponent={<ListHeader />}
          onRefetch={handleRefresh}
          onLayout={() => {}} // Force layout recalculation
          removeClippedSubviews={false} // Prevent clipping during animation
          contentContainerStyle={{
            paddingBottom: insets.bottom,
          }}
          renderConversation={({ item }) => {
            return (
              <AnimatedHStack
                entering={theme.animation.reanimatedFadeInSpring}
                style={{
                  flex: 1,
                }}
              >
                {isConversationGroup(item) ? (
                  <ConversationListItemGroupWrapper group={item} />
                ) : (
                  <ConversationListItemDmWrapper dm={item} />
                )}
              </AnimatedHStack>
            );
          }}
        />
// ... existing code ...
```

The changes:
1. Added `removeClippedSubviews={false}` to ensure subviews aren't clipped during animation
2. Added an empty `onLayout` handler to force layout recalculation when content changes

This should allow the `ListHeader` to animate properly while being part of the `ListHeaderComponent`. The list will now properly respond to height changes in the header.

You can also remove the standalone `<ListHeader />` that was placed before the `ConversationList` since we're now using it in `ListHeaderComponent`.

---



---

