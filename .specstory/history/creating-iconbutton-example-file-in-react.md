## SpecStory

## Creating IconButton Example File in React (11/8/2024, 10:57:23 AM)

_**User**_

do somethhing like @TextField.example.tsx but for @IconButton.example.tsx 

---

_**Assistant**_

I'll help you create an example file for IconButton that demonstrates various use cases, similar to the TextField example. Here's a comprehensive example:

```typescript:design-system/IconButton/IconButton.example.tsx
import { memo } from "react";

import { useAppTheme } from "../../theme/useAppTheme";
import { HStack } from "../HStack";
import { VStack } from "../VStack";
import { Text } from "../Text/Text";
import { IconButton } from "./IconButton";

export const IconButtonExample = memo(function IconButtonExample() {
  const { theme } = useAppTheme();

  return (
    <VStack
      style={{
        paddingTop: 100,
        paddingHorizontal: 24,
        rowGap: 24,
      }}
    >
      {/* Default variants */}
      <VStack style={{ rowGap: 16 }}>
        <Text>Default Size</Text>
        <HStack style={{ columnGap: 16 }}>
          <IconButton variant="fill" iconName="heart" />
          <IconButton variant="outline" iconName="heart" />
          <IconButton variant="ghost" iconName="heart" />
        </HStack>
      </VStack>

      {/* Large size */}
      <VStack style={{ rowGap: 16 }}>
        <Text>Large Size</Text>
        <HStack style={{ columnGap: 16 }}>
          <IconButton variant="fill" iconName="heart" size="lg" />
          <IconButton variant="outline" iconName="heart" size="lg" />
          <IconButton variant="ghost" iconName="heart" size="lg" />
        </HStack>
      </VStack>

      {/* Different actions */}
      <VStack style={{ rowGap: 16 }}>
        <Text>Actions</Text>
        <HStack style={{ columnGap: 16 }}>
          <IconButton variant="fill" iconName="star" action="primary" />
          <IconButton variant="fill" iconName="warning" action="warning" />
          <IconButton variant="fill" iconName="xmark" action="error" />
        </HStack>
      </VStack>

      {/* Disabled state */}
      <VStack style={{ rowGap: 16 }}>
        <Text>Disabled</Text>
        <HStack style={{ columnGap: 16 }}>
          <IconButton variant="fill" iconName="heart" disabled />
          <IconButton variant="outline" iconName="heart" disabled />
          <IconButton variant="ghost" iconName="heart" disabled />
        </HStack>
      </VStack>

      {/* Common use cases */}
      <VStack style={{ rowGap: 16 }}>
        <Text>Common Use Cases</Text>
        <HStack style={{ columnGap: 16 }}>
          <IconButton variant="ghost" iconName="magnifyingglass" />
          <IconButton variant="ghost" iconName="bell" />
          <IconButton variant="ghost" iconName="gear" />
          <IconButton variant="ghost" iconName="trash" action="error" />
        </HStack>
      </VStack>
    </VStack>
  );
});
```

This example demonstrates:
1. Different variants (fill, outline, ghost)
2. Different sizes (default, large)
3. Different actions (primary, warning, error)
4. Disabled states
5. Common use cases with relevant icons

The layout is organized in sections with descriptive text labels, making it easy to understand the different variations of the IconButton component. Each section is wrapped in a VStack with proper spacing, and the buttons are arranged horizontally using HStack.

---



---

