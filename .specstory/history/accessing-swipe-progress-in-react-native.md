## SpecStory

## Accessing Swipe Progress in React Native (1/9/2025, 3:07:41 PM)

_**User**_

renderLeftActions will callback a funciton with arg with progressAV. I want to be able to also ahve acess to that progressAV in my component no just in LeftSwipeableActions

---

_**Assistant**_

I'll help you access the progress animated value in the main component. We'll modify the code to share the animated value using the existing `leftActionsProgressAV` shared value.

```typescript:features/conversation-list/components/conversation-list-item/V3DMListItem.tsx
// ... existing code ...

export const V3DMListItem = ({ conversation }: V3DMListItemProps) => {
  // ... existing code ...

  const leftActionsProgressAV = useSharedValue(0);
  const rightActionsProgressAV = useSharedValue(0);

  const renderLeftActions = useCallback((args: ISwipeableRenderActionsArgs) => {
    // This will update the shared value whenever the swipe progress changes
    leftActionsProgressAV.value = args.progressAnimatedValue.value;
    return <LeftSwipeableActions {...args} />;
  }, []);

  // Now you can use leftActionsProgressAV directly in your component
  useDerivedValue(() => {
    // Example: Do something with the progress value
    if (leftActionsProgressAV.value > 0.5) {
      console.log('Swipe is more than halfway');
    }
  }, []);

  return (
    <Swipeable
      renderLeftActions={renderLeftActions}
      leftThreshold={theme.spacing["5xl"]}
      onLeftSwipe={() => {
        console.log("left swipe");
      }}
    >
      {/* ... rest of the component ... */}
    </Swipeable>
  );
};

// ... rest of the file ...
```

The key changes are:
1. We're already updating `leftActionsProgressAV.value` in the `renderLeftActions` callback
2. You can now use `leftActionsProgressAV` anywhere in your main component with `useDerivedValue` or other Reanimated hooks to react to the swipe progress

The shared value will update in real-time as the user swipes, giving you access to the progress value throughout your component.

---

_**User**_

tried this an dit wodnest work

---

_**Assistant**_

Let's try a different approach using a worklet function to ensure proper reactivity with Reanimated. Here's how we can modify the code:

```typescript:features/conversation-list/components/conversation-list-item/V3DMListItem.tsx
import { runOnJS, withTiming } from 'react-native-reanimated';
// ... existing imports ...

export const V3DMListItem = ({ conversation }: V3DMListItemProps) => {
  // ... existing code ...

  const leftActionsProgressAV = useSharedValue(0);
  
  const updateProgress = useCallback((value: number) => {
    'worklet';
    leftActionsProgressAV.value = value;
  }, []);

  const renderLeftActions = useCallback((args: ISwipeableRenderActionsArgs) => {
    args.progressAnimatedValue.value = withTiming(args.progress);
    updateProgress(args.progress);
    return <LeftSwipeableActions {...args} />;
  }, [updateProgress]);

  // Now you can use leftActionsProgressAV anywhere in the component
  useDerivedValue(() => {
    console.log('Main component progress:', leftActionsProgressAV.value);
  }, []);

  return (
    <Swipeable
      renderLeftActions={renderLeftActions}
      leftThreshold={theme.spacing["5xl"]}
      onLeftSwipe={() => {
        console.log("left swipe");
      }}
    >
      <ConversationListItem
        // ... existing props ...
      />
    </Swipeable>
  );
};
```

The key changes are:
1. Created a worklet function `updateProgress` to properly update the shared value
2. Updated `renderLeftActions` to use the worklet function
3. Used `withTiming` to ensure smooth animations

This should now properly track the swipe progress throughout your component. Let me know if you're still experiencing issues.

---



---

