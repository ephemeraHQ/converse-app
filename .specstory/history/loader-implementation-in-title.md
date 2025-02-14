## SpecStory

## Loader Implementation in Title (1/17/2025, 10:04:54 AM)

_**User**_

Ok. finaly I want title to have the Loader 

---

_**Assistant**_

I'll help you modify the code to move the Loader to the title instead of the subtitle. Here's the corrected version:

```typescript:features/conversation-list/conversation-list-awaiting-requests.tsx
// ... existing code ...
    const count = likelyNotSpam.length;
    const title = !isLoading ? (
      <Loader
        size="small"
        style={{
          alignSelf: "flex-start",
        }}
      />
    ) : "Requests";

    const subtitle = count === 0 ? "All clear" : `${count} new contacts`;

    return (
      <AnimatedVStack
        layout={theme.animation.reanimatedLayoutSpringTransition}
        entering={theme.animation.reanimatedFadeInSpring}
      >
        <ConversationListItem
          title={title}
          onPress={() => {
            navigation.navigate("ChatsRequests");
          }}
          subtitle={subtitle}
// ... existing code ...
```

The changes:
1. Created a `title` variable that shows the Loader when `isLoading` is false, otherwise shows "Requests"
2. Simplified the `subtitle` logic to just show either "All clear" or the count of new contacts
3. Updated the `ConversationListItem` to use the dynamic `title` prop

---



---

