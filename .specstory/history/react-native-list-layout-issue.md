## SpecStory

## React Native List Layout Issue (1/30/2025, 10:47:48 AM)

_**User**_

problem. I want paddingBottom on the content, BUT i also want listEmpty componetn to be full screen... and if i add padding bottom on cotentn the LsitEmtpy component will not touch the bottom of screen 

---

_**Assistant**_

I understand the issue. You want padding at the bottom of the list when there are items, but when the list is empty, you want the empty state component to fill the entire screen. Here's how we can solve this:

```typescript:features/conversation-list/conversation-list.screen.tsx
// ... existing code ...
        <ConversationList
          conversations={conversations ?? []}
          scrollEnabled={conversations && conversations?.length > 0}
          ListEmptyComponent={<ConversationListEmpty />}
          ListHeaderComponent={<ListHeader />}
          onRefetch={handleRefresh}
          onLayout={() => {}}
          layout={theme.animation.reanimatedLayoutSpringTransition}
          contentContainerStyle={{
            flex: conversations?.length === 0 ? 1 : undefined,
            paddingBottom: conversations?.length > 0 ? theme.spacing.lg : 0,
          }}
          renderConversation={({ item }) => {
            return isConversationGroup(item) ? (
              <ConversationListItemGroupWrapper group={item} />
            ) : (
              <ConversationListItemDmWrapper dm={item} />
            );
          }}
        />
// ... existing code ...
```

The changes:
1. Made the `flex: 1` conditional - only apply it when there are no conversations
2. Added conditional `paddingBottom` that only applies when there are conversations

This way:
- When the list is empty, the `ListEmptyComponent` will take up the full screen height because of `flex: 1`
- When there are items in the list, we'll have padding at the bottom of the content, but no flex which allows normal scrolling behavior

---



---

