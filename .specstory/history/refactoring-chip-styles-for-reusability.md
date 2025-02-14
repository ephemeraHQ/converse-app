## SpecStory

## Refactoring Chip Styles for Reusability (2/5/2025, 1:10:37 PM)

_**User**_

i want chipHeight to reuse container.paddingVertical and $content.height. also maybe find a cleaner way to do all this. because i want constants and i want styles you know

---

_**Assistant**_

I'll help you refactor the styles to be cleaner and reuse the calculated values. Here's how we can improve the `useChipStyles`:

```typescript:design-system/chip.tsx
export function useChipStyles() {
  const { theme } = useAppTheme();

  // Calculate base values first
  const paddingVertical = theme.spacing.xxs - theme.borderWidth.sm * 2;
  const contentHeight = theme.spacing.md;

  return {
    // Constants that can be used outside of styles
    constants: {
      chipHeight: paddingVertical * 2 + contentHeight,
    },
    // Styles with $ prefix
    $container: {
      borderRadius: theme.spacing.xs,
      borderWidth: theme.borderWidth.sm,
      borderColor: theme.colors.border.subtle,
      backgroundColor: theme.colors.background.surface,
      paddingVertical,
      paddingHorizontal: theme.spacing.xs,
    },
    $selectedContainer: {
      backgroundColor: theme.colors.fill.minimal,
      borderColor: theme.colors.fill.minimal,
    },
    $content: {
      columnGap: theme.spacing.xxxs,
      height: contentHeight,
    },
  };
}
```

Key improvements made:
1. Extracted common calculations into variables at the top for better reusability and readability
2. Used these variables in both the constants and styles
3. The `chipHeight` now correctly uses `paddingVertical * 2` (for top and bottom) plus the content height
4. Kept the style object structure with separate constants and $ prefixed styles

This makes the code more maintainable and ensures consistency between the calculated height and the actual component dimensions.

---



---

