## SpecStory

## Fixing Avatar Width Calculation in TypeScript (1/8/2025, 1:05:06 PM)

_**User**_

ahow can i use numberOfColumns here

---

_**Assistant**_

I notice there's a reference error in the `avatar` calculation where `numberOfColumns` is used directly but it should reference the property from within the same object. Here's how to fix it:

```typescript:theme/layout.ts
// ... existing code ...
  conversationList: {
    pinned: {
      numberOfColumns: 3, 
      containerHorizontalPadding: spacing.lg,
      columnGap: spacing.sm,
      avatar: (width: number) =>
        (Dimensions.get("window").width -
          spacing.lg * 2 -
          spacing.sm * (3 - 1)) /
        3,
    },
  },
// ... existing code ...
```

There are two approaches you could take:

1. The fix shown above: Make `avatar` a function that calculates the value (recommended for dynamic values)

2. Alternative approach: Reference the numberOfColumns property correctly:

```typescript:theme/layout.ts
// ... existing code ...
  conversationList: {
    pinned: {
      numberOfColumns: 3, 
      containerHorizontalPadding: spacing.lg,
      columnGap: spacing.sm,
      get avatar() {
        return (
          (Dimensions.get("window").width -
            spacing.lg * 2 -
            spacing.sm * (this.numberOfColumns - 1)) /
          this.numberOfColumns
        );
      },
    },
  },
// ... existing code ...
```

I recommend the first approach (making it a function) because:
1. It's more explicit about being a computed value
2. It's easier to test
3. It avoids potential issues with `this` binding
4. It's more consistent with functional programming patterns

The calculation remains the same in both cases - it's determining the width for each avatar by:
1. Taking the full screen width
2. Subtracting the padding on both sides (`spacing.lg * 2`)
3. Subtracting the gaps between columns (`spacing.sm * (numberOfColumns - 1)`)
4. Dividing by the number of columns to get the width per avatar

---



---

