## SpecStory

## Creating a Text Component Example in React (11/8/2024, 11:07:35 AM)

_**User**_

do something like in @IconButton.example.tsx but for text 

---

_**Assistant**_

I'll help you create a Text example component that showcases different text variants and use cases. Here's a comprehensive example:

```typescript:design-system/Text/Text.example.tsx
import { memo } from "react";
import { useAppTheme } from "../../theme/useAppTheme";
import { VStack } from "../VStack";
import { Text } from "./Text";

export const TextExample = memo(function TextExample() {
  const { theme } = useAppTheme();

  return (
    <VStack
      style={{
        paddingTop: theme.spacing.xxl,
        paddingHorizontal: theme.spacing.lg,
        rowGap: theme.spacing.lg,
      }}
    >
      {/* Heading variants */}
      <VStack style={{ rowGap: theme.spacing.sm }}>
        <Text variant="heading1">Heading 1</Text>
        <Text variant="heading2">Heading 2</Text>
        <Text variant="heading3">Heading 3</Text>
      </VStack>

      {/* Body variants */}
      <VStack style={{ rowGap: theme.spacing.sm }}>
        <Text variant="bodyLarge">Body Large - Used for important content</Text>
        <Text variant="bodyMedium">Body Medium - Main content text</Text>
        <Text variant="bodySmall">Body Small - Secondary information</Text>
      </VStack>

      {/* Different colors */}
      <VStack style={{ rowGap: theme.spacing.sm }}>
        <Text variant="bodyMedium" color="primary">Primary Color Text</Text>
        <Text variant="bodyMedium" color="error">Error Color Text</Text>
        <Text variant="bodyMedium" color="secondary">Secondary Color Text</Text>
      </VStack>

      {/* Text alignment */}
      <VStack style={{ rowGap: theme.spacing.sm }}>
        <Text variant="bodyMedium" align="left">Left aligned text</Text>
        <Text variant="bodyMedium" align="center">Center aligned text</Text>
        <Text variant="bodyMedium" align="right">Right aligned text</Text>
      </VStack>

      {/* Common use cases */}
      <VStack style={{ rowGap: theme.spacing.sm }}>
        <Text variant="heading2">Product Details</Text>
        <Text variant="bodyLarge" color="primary">$99.99</Text>
        <Text variant="bodyMedium">High-quality product with amazing features</Text>
        <Text variant="bodySmall" color="secondary">In stock - Ships in 2-3 days</Text>
      </VStack>
    </VStack>
  );
});
```

This example showcases:
1. Different heading variants (h1, h2, h3)
2. Different body text sizes (large, medium, small)
3. Text colors (primary, error, secondary)
4. Text alignment options
5. A real-world example combining different text styles

You can adjust the variants, colors, and other properties based on your actual Text component implementation. This structure provides a good overview of the Text component's capabilities for documentation and testing purposes.

---



---

