## SpecStory

## Custom Entering Animation in React Native (12/4/2024, 2:45:48 PM)

_**User**_

can you build a custom enteinr animation with @https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/custom-animations/ where the block would start at scale 0 in the top right corner and expand and also opacity goes from 0 to 1

---

_**Assistant**_

Certainly! To create a custom entering animation using `react-native-reanimated`, you can define a function that specifies the initial and target values for the animation. Here's how you can implement an animation where the block starts at scale 0 in the top right corner and expands while its opacity transitions from 0 to 1:

```typescript:components/Conversation/V3Conversation.tsx
import { withTiming } from 'react-native-reanimated';

// ... existing code ...

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

// Usage in your component
const MessageContextMenuWrapper = memo(function MessageContextMenuWrapper() {
  const { theme } = useAppTheme();

  const messageContextMenuData = useConversationStore(
    (state) => state.messageContextMenuData
  );

  if (!messageContextMenuData) {
    return null;
  }

  return (
    <MessageContextMenu
      {...messageContextMenuData}
      entering={customEnteringAnimation}
      onClose={() => {
        useConversationStore.setState({
          messageContextMenuData: null,
        });
      }}
    />
  );
});
```

### Explanation:
- **Initial Values**: The animation starts with the block positioned at the top right corner (`originX` set to `targetValues.windowWidth` and `originY` set to `0`), with `scale` set to `0` and `opacity` set to `0`.
- **Animations**: The block animates to its target position (`targetOriginX`, `targetOriginY`), scales to `1`, and fades in to full opacity (`1`) over a duration of `500` milliseconds.

This setup uses `withTiming` to smoothly transition the properties over the specified duration. Adjust the `duration` values as needed to fit your design requirements.

---



---

