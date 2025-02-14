## SpecStory

## Container Styling Adjustments (1/17/2025, 9:24:43 AM)

_**User**_

i want it to expand on sides so maybe negative left/right? BUT at the same time i want if the content is small to be in the middle you know

---

_**Assistant**_

I'll help modify the container style to achieve that effect. We'll use negative margins to expand it while keeping it centered when the content is small.

```typescript:features/conversation-list/conversation-list-pinned-conversations/conversation-list-pinned-conversation-message-preview.tsx
// ... existing code ...

const $containerStyle: ThemedStyle<ViewStyle> = ({
  colors,
  borderRadius,
  borderWidth,
  spacing,
}) => ({
  backgroundColor: colors.background.raised,
  position: "absolute",
  top: 0,
  marginHorizontal: -spacing.md, // Add negative margins to expand
  paddingHorizontal: spacing.xs,
  paddingVertical: spacing.xxs,
  alignSelf: "center", // This keeps it centered when content is small
  justifyContent: "center",
  alignItems: "center",
  borderRadius: borderRadius.sm,
  borderWidth: borderWidth.sm,
  borderColor: colors.border.subtle,
  maxWidth: "100%", // Ensure it doesn't overflow the parent
});

// ... existing code ...
```

I've made two key changes:
1. Added `marginHorizontal: -spacing.md` to make the container expand beyond its normal bounds
2. Added `maxWidth: "100%"` to prevent any potential overflow issues

The `alignSelf: "center"` property that was already there will ensure the container stays centered when the content is small, while the negative margins allow it to expand when needed.

---



---

