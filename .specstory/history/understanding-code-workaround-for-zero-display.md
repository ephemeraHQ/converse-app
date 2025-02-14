## SpecStory

## Understanding Code Workaround for Zero Display (1/29/2025, 1:49:31 PM)

_**User**_

why we do this you think?

---

_**Assistant**_

Looking at this code, the condition `text.value === "0" ? "1" : text.value` appears to be a workaround for a specific edge case or issue. Here are the likely reasons:

1. **Zero Display Issue**: There might have been a bug or undesirable behavior when displaying "0" in the `AnimateableText` component. This could be related to:
   - The component treating "0" as a falsy value and not rendering properly
   - A visual glitch specific to displaying zero
   - A requirement to never show zero and always show "1" instead

2. **Legacy Fix**: This could be a historical fix for a specific business requirement or bug that was encountered, though without more context about the application's requirements, it's hard to be certain.

However, this kind of logic seems quite specific and potentially confusing without proper documentation. I would recommend adding a comment explaining why this transformation is necessary, like:

```typescript:design-system/Text/AnimatedText.tsx
// ... existing code ...
const animatedProps = useAnimatedProps(() => {
  if (!text) {
    return { text: "" };
  }
  // Convert "0" to "1" to prevent [explanation of the specific issue this solves]
  return {
    text: text.value === "0" ? "1" : text.value,
  };
}, [text]);
// ... existing code ...
```

Would you happen to know the specific reason why this conversion was needed? That would help us determine if this workaround is still necessary or if it could be handled in a more explicit way.

---



---

