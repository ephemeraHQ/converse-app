## SpecStory

## Text Overflow Styling Adjustment (1/17/2025, 9:34:50 AM)

_**User**_

here Iw ant the text to be able to have negative left/right and expend beyond it's container by small amount

---

_**Assistant**_

I'll help modify the text styling to allow it to expand slightly beyond its container. Here's the change:

```typescript:features/conversation-list/conversation-list-pinned-conversations/conversation-list-pinned-conversation.tsx
// ... existing code ...

const $text: ThemedStyle<TextStyle> = (theme) => ({
  textAlign: "center",
  maxWidth: theme.spacing["6xl"],
  marginHorizontal: -theme.spacing.xxxs, // Allow text to expand beyond container
});

// ... existing code ...
```

I added a negative `marginHorizontal` using the smallest spacing value (`xxxs`) to allow the text to extend slightly beyond its container boundaries. This creates a small overflow effect while maintaining the center alignment. You can adjust the spacing value if you need more or less overflow.

---



---

