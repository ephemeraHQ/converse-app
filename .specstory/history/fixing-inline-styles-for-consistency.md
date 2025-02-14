## SpecStory

## Fixing Inline Styles for Consistency (1/31/2025, 9:18:33 AM)

_**User**_

fix , inline style

---

_**Assistant**_

I'll help update the styles to follow the pattern of using array syntax for merged styles. Here are the necessary changes:

```typescript:design-system/context-menu/context-menu-item.tsx
// ... existing code ...

export function MenuList({ data, renderItem }: IMenuListProps) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.fills.minimal }]}>
      <FlatList
        data={data}
        renderItem={renderItem}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: theme.fills.subtle }]} />
        )}
        style={[styles.list, { borderRadius: theme.borderRadius.small }]}
      />
    </View>
  );
}

// ... existing code ...

export function ContextMenuItem({
  label,
  iconName,
  onPress,
}: IContextMenuItemProps) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed ? theme.fills.subtle : theme.fills.minimal,
        },
      ]}
    >
      <Text style={[{ color: theme.text.primary }]}>{label}</Text>
      {iconName && (
        <View style={[styles.iconContainer]}>
          <Icon name={iconName} />
        </View>
      )}
    </Pressable>
  );
}

// ... existing code ...
```

Changes made:
1. Added array syntax for the Text component's style prop to be consistent with the style guide
2. Added array syntax for the iconContainer View's style prop
3. All other styles were already using the correct array syntax

The changes ensure consistent usage of array syntax for styles throughout the components, making it easier to merge styles and maintain consistency with the style guide.

---



---

