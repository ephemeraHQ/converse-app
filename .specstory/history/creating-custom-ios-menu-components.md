## SpecStory

## Creating Custom iOS Menu Components (1/31/2025, 9:02:41 AM)

_**User**_

i want to create my own ios menu item component so i need a component that will be just a list maybe just a basic flat list and then i need another component which will be context menu item and those would have a label on the left and an optional icon on the right you can use for the text my own design system text and for the icon my own design system icon and the background you can use a team fill that minimal and you can also put a small border in the list using item separator component and i also want the list to have border radius small. 

---

_**Assistant**_

I'll help you create two components: a menu list and a menu item component following your design system and style guidelines. Here's how we can implement this:

```typescript:src/design-system/menu/menu-list.tsx
import { FlatList, StyleSheet, View } from "react-native";
import { useAppTheme } from "@/theme/useAppTheme";

type IMenuListProps = {
  data: Array<any>;
  renderItem: ({ item }: { item: any }) => React.ReactElement;
};

export function MenuList({ data, renderItem }: IMenuListProps) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.fills.minimal }]}>
      <FlatList
        data={data}
        renderItem={renderItem}
        ItemSeparatorComponent={() => (
          <View
            style={[
              styles.separator,
              { backgroundColor: theme.fills.subtle },
            ]}
          />
        )}
        style={[
          styles.list,
          { borderRadius: theme.borderRadius.small },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  list: {
    width: "100%",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    width: "100%",
  },
});
```design-system/context-menu/context-menu-item.ts

```typescript:src/design-system/menu/menu-item.tsx
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/design-system/text";
import { Icon } from "@/design-system/icon";
import { useAppTheme } from "@/theme/useAppTheme";

type IMenuItemProps = {
  label: string;
  iconName?: string;
  onPress?: () => void;
};

export function MenuItem({ label, iconName, onPress }: IMenuItemProps) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed
            ? theme.fills.subtle
            : theme.fills.minimal,
        },
      ]}
    >
      <Text>{label}</Text>
      {iconName && (
        <View style={styles.iconContainer}>
          <Icon name={iconName} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  iconContainer: {
    marginLeft: 12,
  },
});
```

Here's an example of how to use these components:

```typescript
function ExampleMenu() {
  const menuItems = [
    { label: "Settings", iconName: "settings" },
    { label: "Profile", iconName: "user" },
    { label: "Logout", iconName: "logout" },
  ];

  const renderItem = ({ item }: { item: any }) => (
    <MenuItem
      label={item.label}
      iconName={item.iconName}
      onPress={() => console.log(`Pressed ${item.label}`)}
    />
  );

  return <MenuList data={menuItems} renderItem={renderItem} />;
}
```

This implementation includes:

1. `MenuList`: A wrapper component that uses FlatList with:
   - Custom background color using theme.fills.minimal
   - Border radius from theme
   - Item separators with subtle fill color
   - Proper overflow handling

2. `MenuItem`: A pressable component that includes:
   - Left-aligned label using your design system Text component
   - Optional right-aligned icon using your design system Icon component
   - Press feedback using theme.fills.subtle
   - Proper spacing and alignment

The components are kept simple and focused, following the style guide principles. They use the theme for colors and spacing, and the code is organized with clear type definitions and proper naming conventions.

---

_**User**_

where is the MenuItme component?

---

_**Assistant**_

The `MenuItem` component was shown in the second code block of my previous response, but let me rename it to `ContextMenuItem` to be more consistent with the file structure you're using:

```typescript:src/design-system/context-menu/context-menu-item.tsx
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/design-system/text";
import { Icon } from "@/design-system/icon";
import { useAppTheme } from "@/theme/useAppTheme";

type IContextMenuItemProps = {
  label: string;
  iconName?: string;
  onPress?: () => void;
};

export function ContextMenuItem({ label, iconName, onPress }: IContextMenuItemProps) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed
            ? theme.fills.subtle
            : theme.fills.minimal,
        },
      ]}
    >
      <Text>{label}</Text>
      {iconName && (
        <View style={styles.iconContainer}>
          <Icon name={iconName} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  iconContainer: {
    marginLeft: 12,
  },
});
```

This component is designed to be used within the `ContextMenuList` component. It provides a pressable menu item with a label on the left and an optional icon on the right, using your design system's Text and Icon components.

---



---

