## SpecStory

## Rendering Size Discrepancy in Design (1/17/2025, 9:21:08 AM)

_**User**_

i don't understand something. My design is saying that this $indicator is rendering at 7pt but here I clearly put xxs which has the value of 8 ??

---

_**Assistant**_

Let me help explain this discrepancy. The issue is likely due to rounding in the rendering process. When dealing with small measurements in React Native, sometimes the actual rendered size can be slightly different from the specified size due to:

1. Device pixel ratio considerations
2. Platform-specific rendering behaviors
3. Rounding to the nearest pixel

To ensure you get exactly 7pt, you should explicitly set the size to 7. Here's how to modify the code:

```typescript:features/conversation-list/conversation-list-pinned-conversations/conversation-list-pinned-conversation.tsx
// ... existing code ...

const $indicator: ThemedStyle<ViewStyle> = (theme) => ({
  width: 7,
  height: 7,
  backgroundColor: theme.colors.text.primary,
  borderRadius: theme.spacing.xxxs,
  paddingLeft: theme.spacing.xxxs,
});

// ... existing code ...
```

If you want to keep using theme values but need exactly 7pt, you could also consider adding a new spacing value to your theme specifically for this use case. However, for such a specific size requirement, using the exact pixel value is a reasonable approach.

---

_**User**_

can you show me some docs mentioning this problem with small values in react-native? 

---

_**Assistant**_

I apologize for my previous response. I need to correct myself - I made an assumption without being able to back it up with concrete documentation. After searching, I cannot find official React Native documentation that specifically mentions rounding issues with small values.

I should not have stated this as a fact without being able to provide proper documentation. The discrepancy you're seeing between the design spec (7pt) and the implementation (8pt/xxs) is simply because they're different values, and there's no automatic rounding behavior that I can definitively prove.

The correct approach here would be to:
1. Either use exactly 7pt if that's what the design specifies
2. Or confirm with the design team if using 8pt (theme.spacing.xxs) is acceptable for consistency with the design system

Would you like me to show you how to implement either of these approaches?

---

_**User**_

I want 8pt and xxs value is 8 BUT on the device it's rendering at 7...

---

_**Assistant**_



Ah, now I understand your issue better - you're specifying 8pt (theme.spacing.xxs) but seeing 7pt on the device. This could be happening for a few reasons:

1. Let's verify the actual theme value. Could you add a console.log or use the debugger to check what `theme.spacing.xxs` actually resolves to? 

Here's how you could debug this:

```typescript:features/conversation-list/conversation-list-pinned-conversations/conversation-list-pinned-conversation.tsx
const $indicator: ThemedStyle<ViewStyle> = (theme) => {
  console.log('XXS spacing value:', theme.spacing.xxs);
  return {
    width: theme.spacing.xxs,
    height: theme.spacing.xxs,
    backgroundColor: theme.colors.text.primary,
    borderRadius: theme.spacing.xxxs,
    paddingLeft: theme.spacing.xxxs,
  };
};
```

2. You could also try measuring the actual rendered size using React Native's measure function to confirm what's being rendered:

```typescript:features/conversation-list/conversation-list-pinned-conversations/conversation-list-pinned-conversation.tsx
// ... existing code ...
const indicatorRef = useRef(null);

// In your component:
<Center 
  ref={indicatorRef}
  style={themed($indicator)} 
  onLayout={() => {
    indicatorRef.current?.measure((x, y, width, height) => {
      console.log('Actual rendered size:', {width, height});
    });
  }}
/>
```

This will help us understand if:
1. The theme value is actually 8
2. What size React Native is actually rendering

Could you try either of these approaches and share what you find? This will help us better understand where the discrepancy is occurring.

---



---

