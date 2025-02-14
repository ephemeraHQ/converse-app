## SpecStory

## Adding Delay to Custom Animation (12/4/2024, 3:40:02 PM)

_**User**_

how to add a delay to the custom animation

---

_**Assistant**_

To add a delay to the custom animation in your `MessageContextMenuItems` component, you can use the `delay` function from `react-native-reanimated`. This function allows you to introduce a delay before the animation starts.

Here's how you can modify your `customEnteringAnimation` to include a delay:

```typescript:components/Chat/Message/message-context-menu/message-context-menu-items.tsx
import { delay } from "react-native-reanimated";

// ... existing code ...

const customEnteringAnimation = useCallback(
  (targetValues: EntryAnimationsValues) => {
    "worklet";
    const animations = {
      originX: delay(
        300, // delay in milliseconds
        withSpring(targetValues.targetOriginX, theme.animation.contextMenuSpring)
      ),
      originY: delay(
        300,
        withSpring(targetValues.targetOriginY, theme.animation.contextMenuSpring)
      ),
      opacity: delay(
        300,
        withSpring(1, theme.animation.contextMenuSpring)
      ),
      transform: [
        { scale: delay(300, withSpring(1, theme.animation.contextMenuSpring)) },
      ],
    };

    const initialValues = {
      originX: MENU_ITEMS_WIDTH,
      originY: 0,
      opacity: 0,
      transform: [{ scale: 0 }],
    };

    return {
      initialValues,
      animations,
    };
  },
  [theme.animation.contextMenuSpring]
);

// ... existing code ...
```

### Explanation:
- **`delay(300, ...)`**: This introduces a 300ms delay before each animation starts. You can adjust the delay duration by changing the `300` to any other value in milliseconds.
- The `delay` function wraps around the `withSpring` function to ensure the delay is applied to each animation property.

---



---

