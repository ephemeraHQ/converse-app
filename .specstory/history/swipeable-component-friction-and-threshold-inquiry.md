## SpecStory

## Swipeable Component Friction and Threshold Inquiry (1/9/2025, 12:46:46 PM)

_**User**_

can you look in the docs for this swipeable component and check if there's a way to tell what is the friction or treshold for when we opened a panel (example left) and wnat to close it from draging from right to left for example

---

_**Assistant**_

I'll check the React Native Gesture Handler's ReanimatedSwipeable documentation.

Looking at the [documentation](https://docs.swmansion.com/react-native-gesture-handler/docs/api/components/swipeable), there are a few relevant props that can help control this behavior:

1. `friction` - Controls the friction for the animated value when the item is being swiped.
2. `leftThreshold` and `rightThreshold` - These determine how far the swipe needs to go to trigger the open/close action.
3. `overshootFriction` - (which you're already using) Controls resistance when swiping past the threshold.

For your specific case of wanting to control the friction when closing from the opposite side, we can modify the code to use the `friction` prop. Here's how to update it:

```typescript:components/swipeable.tsx
// ... existing code ...

export type ISwipeableProps = {
  // ... existing props ...
  /** Friction for the animated value when swiping, default is 1 */
  friction?: number;
  // ... existing props ...
};

export function Swipeable({
  // ... existing destructured props ...
  friction = 1,
  // ... existing destructured props ...
}: ISwipeableProps) {
  // ... existing code ...

  return (
    <ReanimatedSwipeable
      // ... existing props ...
      friction={friction}
      // ... rest of the props ...
    >
      {children}
    </ReanimatedSwipeable>
  );
}
```

The `friction` prop will affect both opening and closing animations. A higher friction value will make the swipe movement feel more resistant, while a lower value will make it feel more fluid.

If you want different friction values for opening vs closing, unfortunately the component doesn't provide separate props for this. You would need to either:
1. Fork the component and modify it
2. Create a wrapper that uses the underlying gesture handler directly
3. Use different components like `PanGestureHandler` to build your own swipeable implementation

---



---

