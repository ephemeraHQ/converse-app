## SpecStory

## Custom Animation with useCallback in React (12/4/2024, 3:14:56 PM)

_**User**_

put the customEnteirngAnimiaton inside the component as useCallback function and use theme.animations.contextMenu for withSpring 

---

_**Assistant**_

Certainly! Here's how you can refactor the `customEnteringAnimation` function to be inside the `MessageContextMenuItems` component using `useCallback`, and utilize `theme.animations.contextMenu` for `withSpring`.

```typescript:components/Chat/Message/message-context-menu/message-context-menu-items.tsx
import { useCallback } from "react";
// ... existing imports ...

export const MessageContextMenuItems = memo(
  function MessageContextMenuItems(props: {
    items: TableViewItemType[];
    itemRectWidth: number;
  }) {
    const { theme } = useAppTheme();
    const { items, itemRectWidth } = props;

    const customEnteringAnimation = useCallback(
      (args: { originX: number; originY: number }) => (targetValues) => {
        "worklet";
        const animations = {
          originX: withSpring(targetValues.targetOriginX, theme.animations.contextMenu),
          originY: withSpring(targetValues.targetOriginY, theme.animations.contextMenu),
          opacity: withSpring(1, theme.animations.contextMenu),
          transform: [{ scale: withSpring(1, theme.animations.contextMenu) }],
        };

        const initialValues = {
          originX: args.originX,
          originY: args.originY,
          opacity: 0,
          transform: [{ scale: 0 }],
        };

        return {
          initialValues,
          animations,
        };
      },
      [theme.animations.contextMenu]
    );

    return (
      <AnimatedVStack
        entering={customEnteringAnimation({
          originX: itemRectWidth,
          originY: 0,
        })}
      >
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
```

### Explanation:
- **useCallback**: The `customEnteringAnimation` function is now wrapped in `useCallback` to memoize it, preventing unnecessary re-creations on each render.
- **theme.animations.contextMenu**: This is used in place of `SICK_SPRING_CONFIG` for the `withSpring` function, allowing for theme-based animation configurations.

---



---

