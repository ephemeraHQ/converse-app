## SpecStory

## Updating Swipe Direction in React Native (1/9/2025, 3:17:22 PM)

_**User**_

where could I update the value of this ?

---

_**Assistant**_

You'll want to track the swipe direction by updating `swipeDirectionAV` when the swipe gesture starts. You can do this using the `onSwipeableWillBegin` prop on `ReanimatedSwipeable`. Here's how to modify the code:

```typescript:components/swipeable.tsx
// ... existing code ...

export function Swipeable({
  // ... existing props ...
}) {
  // ... existing code ...

  const onSwipeableWillBegin = useCallback(
    (direction: "left" | "right") => {
      logger.debug("[Swipeable] onSwipeableWillBegin", { direction });
      swipeDirectionAV.value = direction;
    },
    []
  );

  return (
    <ReanimatedSwipeable
      // ... existing props ...
      onSwipeableWillBegin={onSwipeableWillBegin}
      // ... existing props ...
    >
      {children}
    </ReanimatedSwipeable>
  );
}
```

This will update the `swipeDirectionAV` shared value as soon as the swipe gesture begins, allowing your animated style to update the background color accordingly. The `onSwipeableWillBegin` callback is called with the direction of the swipe before the swipe animation starts.

---



---

