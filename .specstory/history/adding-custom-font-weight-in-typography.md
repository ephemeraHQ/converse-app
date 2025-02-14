## SpecStory

## Adding Custom Font Weight in Typography (1/29/2025, 10:29:23 AM)

_**User**_

i want to add a custom weight. where should i add the typing for this? in text.styles.ts? in  @typography.ts ? 

---

_**Assistant**_

Based on the code shown, you'll need to add the typing in both files. Let me help you with the necessary changes:

1. First, let's add the new weight to the fonts definition in typography.ts:

```typescript:theme/typography.ts
// ... existing code ...
const fonts = {
  roboto: {
    // Cross-platform Google font.
    light: "Roboto-Light",
    normal: "Roboto-Regular",
    medium: "Roboto-Medium",
    semiBold: "Roboto-SemiBold",
    bold: "Roboto-Bold",
    bodyBold: "Roboto-Medium", // Add this line
  },
  sfPro: {
    // iOS (post iOS 9) system font.
    thin: "SFProText-Thin",
    light: "SFProText-Light",
    normal: "SFProText-Regular",
    medium: "SFProText-Medium",
    semiBold: "SFProText-Semibold",
    bold: "SFProText-Bold",
    bodyBold: "SFProText-Medium", // Add this line
  },
  // ... existing code ...
};
```

2. Then, you'll need to update the IWeights type in Text.props.ts (which should be in the same directory as Text.styles.ts). If you don't have this type defined yet, you should create it:

```typescript:design-system/Text/Text.props.ts
export type IWeights = 
  | "light"
  | "normal"
  | "medium"
  | "semiBold"
  | "bold"
  | "bodyBold";
```

The changes you already have in Text.styles.ts (adding `bodyBold: 510` to numericWeights) are correct and will work with these updates.

Note: I notice you're using `bodyBold: 510` which is an unusual font weight. Make sure this is intentional, as standard font weights are typically multiples of 100 (100-900). You might want to use 500 instead if this was not intentional.

---

_**User**_

we have IWieghts in @Text.props.ts 

---

_**Assistant**_

Ah yes, I see it now. In Text.props.ts, IWeights is already defined as:
```typescript
export type IWeights = keyof typeof typography.primary;
```

This means we only need to add the new weight in typography.ts, and it will automatically be included in IWeights through the type inference. Here's the only change needed:

```typescript:theme/typography.ts
// ... existing code ...
const fonts = {
  roboto: {
    // Cross-platform Google font.
    light: "Roboto-Light",
    normal: "Roboto-Regular",
    medium: "Roboto-Medium",
    semiBold: "Roboto-SemiBold",
    bold: "Roboto-Bold",
    bodyBold: "Roboto-Medium", // Add this line
  },
  sfPro: {
    // iOS (post iOS 9) system font.
    thin: "SFProText-Thin",
    light: "SFProText-Light",
    normal: "SFProText-Regular",
    medium: "SFProText-Medium",
    semiBold: "SFProText-Semibold",
    bold: "SFProText-Bold",
    bodyBold: "SFProText-Medium", // Add this line
  },
  // ... existing code ...
};
```

Since IWeights is derived from the typography.primary keys, TypeScript will automatically include "bodyBold" as a valid weight option once you add it to the fonts object.

---



---

