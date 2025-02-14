## SpecStory

## Streamlining Menu List Component (1/31/2025, 9:22:39 AM)

_**User**_

Oh don't use flatlist it's overkill. So make the menu list like menu list container instead and it's good it should be pretty simple also make sure to inline all the styles 

---

_**Assistant**_

I'll help simplify the MenuList component by removing FlatList and inlining the styles. Here's the updated code:

```typescript:design-system/dropdown-menu/dropdown-menu-custom.tsx
// ... existing code ...

type IMenuListContainerProps = {
  children: React.ReactNode;
};

export function MenuListContainer({ children }: IMenuListContainerProps) {
  const { theme } = useAppTheme();

  return (
    <View
      style={{
        overflow: "hidden",
        backgroundColor: theme.fills.minimal,
        borderRadius: theme.borderRadius.small,
      }}
    >
      {children}
    </View>
  );
}

type IContextMenuItemProps = {
  label: string;
  iconName?: string;
  onPress?: () => void;
};

export function ContextMenuItem({
  label,
  iconName,
  onPress,
}: IContextMenuItemProps) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        backgroundColor: pressed ? theme.fills.subtle : theme.fills.minimal,
      })}
    >
      <Text style={{ color: theme.text.primary }}>{label}</Text>
      {iconName && (
        <View style={{ marginLeft: 12 }}>
          <Icon name={iconName} />
        </View>
      )}
    </Pressable>
  );
}
```

Key changes made:
1. Removed FlatList and replaced MenuList with MenuListContainer that simply wraps its children
2. Removed separate StyleSheet definitions and inlined all styles
3. Removed the separator component since it's no longer needed without FlatList
4. Simplified the types by removing the data and renderItem props in favor of children

Now you can use it like this:
```tsx
<MenuListContainer>
  <ContextMenuItem label="Item 1" />
  <ContextMenuItem label="Item 2" iconName="some-icon" />
</MenuListContainer>
```

---



---

