## SpecStory

## Improve Swipeable Component Callbacks (1/9/2025, 12:06:06 PM)

_**User**_

remove onWillLeftSWipeAndonwillRightSwipe and call onLeftSwipe instead. Maybe put small comment to explain but basically onSwipeableClose and onSwipeableOpen are too slow like I finish the swipe and the callback is called after 1 sec. While the "will..." is called instantly and that's the UX we want

---

_**Assistant**_

I'll help modify the code to use the instant callbacks instead of the delayed ones. Here are the changes:

```typescript:components/swipeable.tsx
export type ISwipeableProps = {
  // Action renderers
  renderLeftActions?: SwipeableProps["renderLeftActions"];
  renderRightActions?: SwipeableProps["renderRightActions"];

  // Swipe callbacks
  onLeftSwipe?: () => void;
  onRightSwipe?: () => void;
  // Removed onWillLeftSwipe and onWillRightSwipe

  // ... rest of the props ...
};

export function Swipeable({
  renderLeftActions,
  renderRightActions,
  onLeftSwipe,
  onRightSwipe,
  // Removed from destructuring
  leftThreshold,
  // ... rest of the props ...
}: ISwipeableProps) {
  const onSwipeableWillClose = useCallback(
    (direction: "left" | "right") => {
      logger.debug("[Swipeable] onSwipeableWillClose", { direction });

      // Call onLeftSwipe/onRightSwipe directly here for instant feedback
      if (direction === "left") {
        onLeftSwipe?.();
      } else {
        onRightSwipe?.();
      }
    },
    [onLeftSwipe, onRightSwipe]
  );

  // Remove onSwipeableClose since we now handle the action in onSwipeableWillClose
  
  return (
    <ReanimatedSwipeable
      // ... existing props ...
      onSwipeableWillClose={onSwipeableWillClose}
      // Remove onSwipeableClose prop
      // ... rest of the props ...
    >
      {children}
    </ReanimatedSwipeable>
  );
}
```

The changes:
1. Removed `onWillLeftSwipe` and `onWillRightSwipe` props since we're not using them anymore
2. Moved the swipe action callbacks to `onSwipeableWillClose` for instant feedback
3. Removed `onSwipeableClose` since it was causing the delayed response
4. Updated types to reflect the changes

The component will now trigger the swipe actions immediately when the swipe gesture is about to end, rather than waiting for the animation to complete.

---



---

