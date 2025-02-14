## SpecStory

## Converting Styles to TextStyle in TypeScript (11/4/2024, 3:03:02 PM)

_**User**_

how cna i convert this to TextStyle

---

_**Assistant**_

I'll help you convert the array-based styles to a merged TextStyle object. Here's how to modify the files:

```typescript:design-system/Text/Text.presets.ts
// ... existing imports ...

// Update the type to use TextStyle directly
export type IPresets =
  | "title"
  | "body"
  | "bodyBold"
  | "small"
  | "smaller"
  | "smallerBold"
  | "bigBold"
  | "formHelper"
  | "formLabel";

// Change the Record type to use TextStyle
export const textPresets: Record<IPresets, TextStyle> = {
  title: {
    ...textBaseStyle,
    ...textSizeStyles.xl,
    ...textFontWeightStyles.bold,
  },

  body: {
    ...textBaseStyle,
  },

  bodyBold: {
    ...textBaseStyle,
    ...textFontWeightStyles.bold,
  },

  // ... continue for other presets using the spread operator pattern ...

  formHelper: {
    ...textBaseStyle,
    ...textSizeStyles.xs,
    color: colors.fill.secondary, // Note: You'll need to handle theme differently
  },

  formLabel: {
    ...textBaseStyle,
    ...textSizeStyles.xs,
    color: colors.text.secondary, // Note: You'll need to handle theme differently
  },
};
```

A few important notes:
1. This change will require updating how theming works since we can't use the function-based approach anymore with plain TextStyle
2. You'll need to modify the Text component to handle theming differently
3. Consider using a utility function to merge styles if you need to maintain theme support

Would you like me to provide a solution that maintains theme support while using TextStyle?

---



---

