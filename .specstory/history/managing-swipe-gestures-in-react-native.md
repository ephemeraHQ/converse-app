## SpecStory

## Managing Swipe Gestures in React Native (1/10/2025, 10:02:36 AM)

_**User**_

look the docs of the lib is there anyway to tell like if we swipe left from x = 0 we don't want to trigger the swipe... because for example I might have a gesture handling going back from  ascreen but not it triggers the swipe every time

---

_**Assistant**_

Looking at the `react-native-gesture-handler/ReanimatedSwipeable` documentation, we can use the `hitSlop` prop to create a dead zone where swipes won't be detected. This would help prevent conflicts with navigation gestures.

Here's how to modify the component:

```typescript:components/swipeable.tsx
export type ISwipeableProps = {
  // ... existing props ...
  
  /** Dead zone from edges where swipe won't trigger (in pixels) */
  hitSlop?: number;
};

export function Swipeable({
  // ... existing props ...
  hitSlop,
}: ISwipeableProps) {
  // ... existing code ...

  return (
    <ReanimatedSwipeable
      // ... existing props ...
      
      /**
       * Hit slop to prevent swipe from triggering in the dead zone
       * Negative values create a dead zone from the edge
       */
      hitSlop={{ left: hitSlop ? -hitSlop : undefined }}
      
      // ... rest of existing props
    >
      {children}
    </ReanimatedSwipeable>
  );
}
```

This change adds a `hitSlop` prop that creates a dead zone from the left edge where swipes won't be detected. For example, if you set `hitSlop={20}`, swipes won't trigger within 20 pixels from the left edge, allowing navigation gestures to work in that area.

You would use it like this:
```typescript
<Swipeable hitSlop={20} {...otherProps}>
  {children}
</Swipeable>
```

Note: The negative value for `hitSlop.left` is intentional - in React Native Gesture Handler, negative hit slop values create a dead zone from the edge, while positive values extend the touch area beyond the component bounds.

---



---

