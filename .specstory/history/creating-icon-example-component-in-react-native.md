## SpecStory

## Creating Icon Example Component in React Native (11/8/2024, 11:31:39 AM)

_**User**_

create something like @Button.example.tsx with all the possible icons we can have. look in @Icon.tsx 

---

_**Assistant**_

I'll create an Icon example component similar to the Button example that showcases all available icons from the registry.

```typescript:design-system/Icon/Icon.example.tsx
import { ScrollView } from "react-native";
import { VStack } from "@design-system/VStack";
import { HStack } from "@design-system/HStack";
import { Text } from "@design-system/Text";
import { useAppTheme } from "@theme/useAppTheme";
import { Icon } from "./Icon";
import { iconRegistry } from "./Icon";

type IExampleProps = {
  onPress?: () => void;
};

export function IconExample(args: IExampleProps) {
  const { theme } = useAppTheme();

  return (
    <ScrollView>
      <VStack
        style={{
          gap: theme.spacing.md,
          backgroundColor: theme.colors.background.raised,
          padding: theme.spacing.md,
        }}
      >
        {/* Different Sizes */}
        <Text variant="heading">Icon Sizes</Text>
        <HStack style={{ gap: theme.spacing.md, alignItems: "center" }}>
          <Icon icon="star" size={theme.iconSize.sm} />
          <Icon icon="star" size={theme.iconSize.md} />
          <Icon icon="star" size={theme.iconSize.lg} />
          <Icon icon="star" size={theme.iconSize.xl} />
        </HStack>

        {/* Different Colors */}
        <Text variant="heading">Icon Colors</Text>
        <HStack style={{ gap: theme.spacing.md, alignItems: "center" }}>
          <Icon icon="star" color={theme.colors.fill.primary} />
          <Icon icon="star" color={theme.colors.fill.secondary} />
          <Icon icon="star" color={theme.colors.fill.error} />
          <Icon icon="star" color={theme.colors.fill.success} />
        </HStack>

        {/* All Available Icons */}
        <Text variant="heading">All Icons</Text>
        <VStack style={{ gap: theme.spacing.sm }}>
          {Object.entries(iconRegistry).map(([key, value]) => (
            <HStack
              key={key}
              style={{
                gap: theme.spacing.md,
                alignItems: "center",
                padding: theme.spacing.sm,
                backgroundColor: theme.colors.background.default,
                borderRadius: theme.borderRadius.sm,
              }}
            >
              <Icon icon={key as keyof typeof iconRegistry} />
              <Text>{key}</Text>
            </HStack>
          ))}
        </VStack>
      </VStack>
    </ScrollView>
  );
}
```

This example component:
1. Shows icons in different sizes using your theme's iconSize values
2. Demonstrates icons in different colors using your theme's color palette
3. Lists all available icons from the registry with their names
4. Wraps everything in a ScrollView since there are many icons to display
5. Groups icons in a clean, organized layout with proper spacing and background colors
6. Uses your design system components (VStack, HStack, Text) for consistency

Each icon is displayed alongside its name in a row, making it easy to reference which icon name to use in your code. The icons are grouped into sections showing different variations (sizes and colors) and then a comprehensive list of all available icons.

---



---

