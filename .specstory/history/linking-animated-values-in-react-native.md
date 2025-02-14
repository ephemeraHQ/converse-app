## SpecStory

## Linking Animated Values in React Native (1/9/2025, 3:04:45 PM)

_**User**_

leftActionsProgressAV.value = progress.value; doens'T work but how can I link this? like i want the parent to be able to have access to the progress

---

_**Assistant**_

I understand you want to share the swipe progress value with the parent component. In Reanimated 2, to properly share animated values between components, we should use `useSharedValue` and update it using worklets. Here's how to modify the code:

```typescript:components/swipeable.tsx
// ... existing code ...

const renderLeftActionsCallback = useCallback(
    (
      progress: SharedValue<number>,
      drag: SharedValue<number>,
      swipeable: SwipeableMethods
    ) => {
      if (leftActionsProgressAV) {
        // We need to use a worklet to update shared values
        'worklet';
        leftActionsProgressAV.value = progress.value;
      }
      return renderLeftActions?.({
        progressAnimatedValue: progress,
        dragAnimatedValue: drag,
        swipeable,
      });
    },
    [renderLeftActions, leftActionsProgressAV]
  );

// ... existing code ...
```

And here's how to use it in the parent component:

```typescript:parent-component.tsx
import { useSharedValue } from 'react-native-reanimated';

function ParentComponent() {
  const leftProgress = useSharedValue(0);
  
  return (
    <Swipeable
      leftActionsProgressAV={leftProgress}
      // ... other props
    >
      {/* You can now use leftProgress.value in animations or read it in worklets */}
    </Swipeable>
  );
}
```

The key changes are:
1. Added the 'worklet' directive before updating the shared value
2. Showed how to create and pass the shared value from the parent component

Now the parent component will have access to the current swipe progress value through `leftProgress.value` (but remember this can only be read within worklets or used in animated style calculations).

---



---

