## SpecStory

## Adding Borders Between Dropdown Menu Items (1/31/2025, 9:33:16 AM)

_**User**_

 want a small border line between each items and can i do that

---

_**Assistant**_

I'll help you add a border line between dropdown menu items. We'll modify the `DropdownMenuCustomItem` component to include a bottom border, except for the last item.

```typescript:design-system/dropdown-menu/dropdown-menu-custom.tsx
// ... existing code ...

export function DropdownMenuCustomItem({
  label,
  iconName,
  onPress,
}: IDropdownMenuCustomItemProps) {
  const { theme } = useAppTheme();

  const { itemHeight } = useDropdownMenuCustomStyles();

  return (
    <View>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: theme.spacing.sm,
          height: itemHeight,
        })}
      >
        <Text>{label}</Text>
        {iconName && (
          <View style={{ marginLeft: 12 }}>
            <Icon icon={iconName} />
          </View>
        )}
      </Pressable>
      <View
        style={{
          height: 1,
          backgroundColor: theme.colors.border.minimal,
          marginHorizontal: theme.spacing.sm,
        }}
      />
    </View>
  );
}

// ... existing code ...
```

I've made the following changes:
1. Wrapped the `Pressable` in a `View` container
2. Added a 1px height `View` below the `Pressable` that acts as a divider line
3. Used `theme.colors.border.minimal` for the divider color to match the design system
4. Added horizontal margin to the divider to match the padding of the item

Note that this will add a border after every item. If you want to remove the border from the last item, you'll need to pass an additional prop like `isLastItem` and conditionally render the border based on that.

Would you like me to show you how to handle the last item border case as well?

---



---

