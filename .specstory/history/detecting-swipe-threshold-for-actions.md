## SpecStory

## Detecting Swipe Threshold for Actions (1/9/2025, 11:21:47 AM)

_**User**_

is there something i can do so that if we have renderLeftActions, i want to know when we reach the treshhold where the left action will open

---

_**Assistant**_

Yes, you can use the `onSwipeableWillOpen` callback to detect when the swipe reaches the threshold. Here's how to modify the code:

```typescript:components/swipeable.tsx
// ... existing code ...

export type ISwipeableProps = {
  // ... existing props ...
  onWillOpen?: (direction: "left" | "right") => void;  // Add this new prop
};

export function Swipeable({
  // ... existing destructuring ...
  onWillOpen,
}: ISwipeableProps) {
  // ... existing callbacks ...

  const handleSwipeableWillOpen = useCallback(
    (direction: "left" | "right") => {
      logger.debug("[Swipeable] onSwipeableWillOpen", { direction });
      onWillOpen?.(direction);
    },
    [onWillOpen]
  );

  return (
    <ReanimatedSwipeable
      // ... existing props ...
      onSwipeableWillOpen={handleSwipeableWillOpen}
    >
      {children}
    </ReanimatedSwipeable>
  );
}
```

This change:
1. Adds a new `onWillOpen` callback prop that will be called with the direction ("left" or "right") when the swipe reaches the threshold
2. Creates a new callback handler that both logs the event (as before) and calls the new callback
3. Replaces the inline arrow function with our new callback handler

You can then use it like this:
```typescript
<Swipeable
  renderLeftActions={...}
  onWillOpen={(direction) => {
    if (direction === "left") {
      // Handle left swipe threshold reached
    }
  }}
>
  {children}
</Swipeable>
```

---

_**User**_

but "onSwipeableWillOpen" is only called when we release the finger but I want to trigger something as soon as we drag pass the treshhold

---

_**Assistant**_

Ah, I understand now. For that behavior, we'll need to use the `onSwipeableRightProgress` or `onSwipeableLeftProgress` callbacks which provide continuous progress updates. Here's how to modify the code:

```typescript:components/swipeable.tsx
export type ISwipeableProps = {
  // ... existing props ...
  onLeftThresholdReached?: () => void;
  onRightThresholdReached?: () => void;
};

export function Swipeable({
  // ... existing destructuring ...
  onLeftThresholdReached,
  onRightThresholdReached,
  leftThreshold = 0.4, // provide default if not specified
  rightThreshold = 0.4,
}: ISwipeableProps) {
  // Track if we've already triggered the threshold callback
  const hasTriggeredLeft = React.useRef(false);
  const hasTriggeredRight = React.useRef(false);

  const handleLeftProgress = useCallback(
    (progress: number) => {
      if (progress >= leftThreshold && !hasTriggeredLeft.current && onLeftThresholdReached) {
        hasTriggeredLeft.current = true;
        onLeftThresholdReached();
      } else if (progress < leftThreshold) {
        hasTriggeredLeft.current = false;
      }
    },
    [leftThreshold, onLeftThresholdReached]
  );

  const handleRightProgress = useCallback(
    (progress: number) => {
      if (progress >= rightThreshold && !hasTriggeredRight.current && onRightThresholdReached) {
        hasTriggeredRight.current = true;
        onRightThresholdReached();
      } else if (progress < rightThreshold) {
        hasTriggeredRight.current = false;
      }
    },
    [rightThreshold, onRightThresholdReached]
  );

  return (
    <ReanimatedSwipeable
      // ... existing props ...
      onSwipeableLeftProgress={({ progress }) => handleLeftProgress(progress)}
      onSwipeableRightProgress={({ progress }) => handleRightProgress(progress)}
    >
      {children}
    </ReanimatedSwipeable>
  );
}
```

This change:
1. Adds new callback props for threshold reached events
2. Uses refs to track whether we've already triggered the callback (to prevent multiple triggers while holding past threshold)
3. Adds progress handlers that will fire the callbacks exactly when the threshold is crossed
4. Resets the trigger state when progress goes back below threshold

You can use it like this:
```typescript
<Swipeable
  renderLeftActions={...}
  onLeftThresholdReached={() => {
    // This will fire as soon as the drag passes the threshold
  }}
>
  {children}
</Swipeable>
```

---



---

