## SpecStory

## Improving Composability of Settings List Components (1/30/2025, 1:44:41 PM)

_**User**_

make @settings-list.tsx and @settings-list-row.tsx cleaner and more composable.

---

_**Assistant**_

I'll help make these components cleaner and more composable. Here's how we can improve them:

1. First, let's improve the settings-list.tsx by adding better typing and composition:

```typescript:design-system/settings-list/settings-list.tsx
// ... existing code ...

// Make the props interface more explicit
type ISettingsListProps = {
  rows: Array<ISettingsListRow>;
  editMode?: boolean;
  // Add containerStyle for more flexibility
  containerStyle?: ViewStyle;
};

export const SettingsList = memo(function SettingsList({
  rows,
  editMode,
  containerStyle,
}: ISettingsListProps) {
  const { themed } = useAppTheme();

  return (
    <View style={[themed($container), containerStyle]}>
      {rows.map((row, index) => (
        <SettingsListRow
          key={`${row.label}-${index}`}
          row={row}
          editMode={editMode}
        />
      ))}
    </View>
  );
});

// ... existing code ...
```

2. Now let's improve settings-list-row.tsx by breaking it down into more composable pieces:

```typescript:design-system/settings-list/settings-list-row.tsx
import React, { memo } from "react";
import { View, ViewStyle, Switch, TouchableOpacity } from "react-native";
import { Text } from "@/design-system/Text";
import { useAppTheme, ThemedStyle } from "@/theme/useAppTheme";
import { HStack } from "@/design-system/HStack";
import { VStack } from "@/design-system/VStack";
import { Icon } from "@/design-system/Icon/Icon";
import { ISettingsListRow } from "./settings-list.types";

type ISettingsListRowProps = {
  row: ISettingsListRow;
  editMode?: boolean;
  style?: ViewStyle;
};

// Separate the row content into its own component
const RowContent = memo(function RowContent({
  label,
  value,
  isWarning,
  isSwitch,
  onValueChange,
  disabled,
}: Pick<ISettingsListRow, "label" | "value" | "isWarning" | "isSwitch" | "onValueChange" | "disabled">) {
  const { theme, themed } = useAppTheme();

  return (
    <HStack style={themed($innerRowContainer)}>
      <VStack style={themed($labelContainer)}>
        <Text color={isWarning ? "caution" : "primary"}>{label}</Text>
        {value && (
          <Text
            preset="formLabel"
            color={isWarning ? "caution" : "secondary"}
          >
            {value}
          </Text>
        )}
      </VStack>
      <View style={themed($rightContentContainer)}>
        {isSwitch ? (
          <Switch
            value={!!value}
            onValueChange={onValueChange}
            disabled={disabled}
          />
        ) : (
          <Icon
            icon="chevron.right"
            size={theme.iconSize.sm}
            color={theme.colors.text.secondary}
          />
        )}
      </View>
    </HStack>
  );
});

export const SettingsListRow = memo(function SettingsListRow({
  row,
  editMode,
  style,
}: ISettingsListRowProps) {
  const { themed } = useAppTheme();
  
  const Container = row.onPress ? TouchableOpacity : HStack;
  const containerProps = row.onPress ? { onPress: row.onPress } : {};

  return (
    <Container 
      style={[themed($rowContainer), style]} 
      {...containerProps}
    >
      <RowContent {...row} />
    </Container>
  );
});

const $rowContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.md,
  width: "100%",
  flexDirection: "row",
  alignItems: "center",
});

const $labelContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
});

const $innerRowContainer: ThemedStyle<ViewStyle> = () => ({
  width: "100%",
  justifyContent: "space-between",
  alignItems: "center",
});

const $rightContentContainer: ThemedStyle<ViewStyle> = () => ({
  marginLeft: "auto",
  alignItems: "flex-end",
  justifyContent: "center",
});
```

Key improvements made:

1. In SettingsList:
   - Added containerStyle prop for more flexibility
   - Improved key generation for the map function

2. In SettingsListRow:
   - Extracted RowContent into a separate component for better composition
   - Added style prop for more flexibility
   - Used conditional Container component instead of conditional rendering
   - Improved prop typing with Pick utility
   - Added $labelContainer style
   - Made the component more flexible with style prop support

3. General improvements:
   - Better type safety
   - More composable structure
   - Cleaner conditional rendering
   - Better style organization
   - More flexible styling options

These changes make the components more reusable and easier to maintain while following the provided style guide. The components are now more composable and can be styled more flexibly when needed.

---



---

