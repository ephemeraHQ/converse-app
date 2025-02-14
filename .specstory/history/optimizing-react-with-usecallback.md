## SpecStory

## Optimizing React with useCallback (1/9/2025, 2:44:01 PM)

_**User**_

put those above in usecallback

---

_**Assistant**_

I'll help you wrap those render functions in useCallback. Here's how to modify the code:

```typescript:components/swipeable.tsx
export function Swipeable({
  // ... existing props ...
}: ISwipeableProps) {
  const swipeableRef = useRef<SwipeableMethods>(null);

  // ... existing onSwipeableWillOpen callback ...

  const renderLeftActionsCallback = useCallback(
    (progress: SharedValue<number>, drag: SharedValue<number>, swipeable: SwipeableMethods) =>
      renderLeftActions?.({
        progressAnimatedValue: progress,
        dragAnimatedValue: drag,
        swipeable,
      }),
    [renderLeftActions]
  );

  const renderRightActionsCallback = useCallback(
    (progress: SharedValue<number>, drag: SharedValue<number>, swipeable: SwipeableMethods) =>
      renderRightActions?.({
        progressAnimatedValue: progress,
        dragAnimatedValue: drag,
        swipeable,
      }),
    [renderRightActions]
  );

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions ? renderLeftActionsCallback : undefined}
      renderRightActions={renderRightActions ? renderRightActionsCallback : undefined}
      // ... rest of the props ...
    >
      {children}
    </ReanimatedSwipeable>
  );
}
```

The changes:
1. Created two new useCallback hooks to memoize the render functions
2. Added proper type annotations for the callback parameters
3. Simplified the conditional rendering by moving the check outside the callback
4. Added the respective render props as dependencies to the useCallback hooks

This will prevent unnecessary re-renders of the action components when other props change.

---



---

