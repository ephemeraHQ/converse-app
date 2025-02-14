## SpecStory

## Adding Separators in VStack Component (1/31/2025, 9:34:38 AM)

_**User**_

i can't add a separtaro to vstack right? so that there's a small border line between each children?

---

_**Assistant**_

You can't add separators directly to VStack, but you can create a separator component and place it between the menu items. Here's how to modify the DropdownMenuContainer to include separators between its children:

```typescript:design-system/dropdown-menu/dropdown-menu-custom.tsx
// ... existing code ...

export function DropdownMenuContainer({ children }: IMenuListContainerProps) {
  const { theme } = useAppTheme();
  const { containerWidth } = useDropdownMenuCustomStyles();

  // Convert children to array and add separators between them
  const childrenArray = React.Children.toArray(children);
  const childrenWithSeparators = childrenArray.flatMap((child, index) => {
    if (index === childrenArray.length - 1) return [child];
    return [
      child,
      <View
        key={`separator-${index}`}
        style={{
          height: 1,
          backgroundColor: theme.colors.border.minimal,
          marginHorizontal: theme.spacing.sm,
        }}
      />,
    ];
  });

  return (
    <VStack
      style={{
        width: containerWidth,
        backgroundColor: theme.colors.fill.minimal,
        borderRadius: theme.borderRadius.xs,
      }}
    >
      {childrenWithSeparators}
    </VStack>
  );
}

// ... existing code ...
```

This modification:
1. Converts the children to an array using `React.Children.toArray()`
2. Uses `flatMap` to insert a separator `View` component between each child
3. The separator is a simple 1px height line using the theme's minimal border color
4. Separators are added between items but not after the last item

The separator will appear as a thin line between each menu item while maintaining the theme consistency.

---



---

