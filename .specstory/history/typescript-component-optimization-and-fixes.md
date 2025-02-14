## SpecStory

## TypeScript Component Optimization and Fixes (12/4/2024, 3:08:03 PM)

_**User**_

fix this

---

_**Assistant**_

Certainly! Let's make some improvements to the code based on your preferences and best practices:

1. Use TypeScript types starting with "I".
2. Use descriptive variable names.
3. Ensure inline styles are used.
4. Use `memo` for performance optimization.

Here's the updated code:

```typescript:components/Chat/Message/message-context-menu/message-context-menu-items.tsx
import TableView, { TableViewItemType } from "@/components/TableView/TableView";
import { AnimatedVStack } from "@/design-system/VStack";
import { useAppTheme } from "@/theme/useAppTheme";
import { memo } from "react";
import { withTiming } from "react-native-reanimated";

type IMessageContextMenuItemsProps = {
  items: TableViewItemType[];
};

export const MessageContextMenuItems = memo(
  function MessageContextMenuItems({ items }: IMessageContextMenuItemsProps) {
    const { theme } = useAppTheme();

    return (
      <AnimatedVStack entering={customEnteringAnimation}>
        <TableView
          items={items}
          style={{
            width: 180,
            backgroundColor:
              Platform.OS === "android"
                ? theme.colors.background.raised
                : undefined,
            borderRadius: Platform.OS === "android" ? 10 : undefined,
          }}
        />
      </AnimatedVStack>
    );
  }
);

const customEnteringAnimation = (targetValues) => {
  'worklet';
  const animations = {
    originX: withTiming(targetValues.targetOriginX, { duration: 500 }),
    originY: withTiming(targetValues.targetOriginY, { duration: 500 }),
    opacity: withTiming(1, { duration: 500 }),
    transform: [{ scale: withTiming(1, { duration: 500 }) }],
  };

  const initialValues = {
    originX: targetValues.windowWidth, // Start from the right
    originY: 0, // Start from the top
    opacity: 0,
    transform: [{ scale: 0 }],
  };

  return {
    initialValues,
    animations,
  };
};
```

### Key Changes:
- Introduced a type `IMessageContextMenuItemsProps` for the component props.
- Used destructuring directly in the function parameters for clarity.
- Ensured inline styles are used in the `TableView` component.
- Wrapped the component in `memo` for performance optimization.

---



---

