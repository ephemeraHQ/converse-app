## SpecStory

## Disabling Right Swipe in Swipeable Component (1/9/2025, 11:06:43 AM)

_**User**_

read teh swipable component props. can we disable drag right?

---

_**Assistant**_

Looking at the component, while there isn't a direct prop for disabling right swipe, we can effectively disable it by not providing the `renderRightActions` prop and setting a very high `rightThreshold`.

Here's how you can modify the usage of the Swipeable component to disable right swipe:

```tsx
<Swipeable
  renderLeftActions={yourLeftActionsRenderer}
  // Don't provide renderRightActions
  // Set a very high threshold for right swipe
  rightThreshold={10000}
  onLeftSwipe={handleLeftSwipe}
>
  {children}
</Swipeable>
```

If you want to make this more explicit in the component itself, we could add a dedicated prop for this. Here's how we could modify the component:

```typescript:components/swipeable.tsx
export type ISwipeableProps = {
  // ... existing props ...
  
  /** Disable right swipe functionality */
  disableRightSwipe?: boolean;
};

export function Swipeable({
  // ... other props ...
  disableRightSwipe,
}: ISwipeableProps) {
  // ... existing code ...

  return (
    <ReanimatedSwipeable
      renderRightActions={disableRightSwipe ? undefined : renderRightActions}
      rightThreshold={disableRightSwipe ? 10000 : rightThreshold}
      // ... other props ...
    >
      {children}
    </ReanimatedSwipeable>
  );
}
```

This gives you a more semantic way to disable right swipe functionality. You could then use it like:

```tsx
<Swipeable
  renderLeftActions={yourLeftActionsRenderer}
  disableRightSwipe
  onLeftSwipe={handleLeftSwipe}
>
  {children}
</Swipeable>
```

---

_**User**_

doesnt' work

---

_**Assistant**_

Let's try a different approach. Looking at the `ReanimatedSwipeable` component from `react-native-gesture-handler`, we can disable right swipe by setting `overshootRight={false}` (which is already set) and explicitly setting `renderRightActions={undefined}`. Let's modify the component:

```typescript:components/swipeable.tsx
// ... existing code ...

return (
  <ReanimatedSwipeable
    renderLeftActions={renderLeftActions ? renderLeftActions : undefined}
    renderRightActions={undefined}  // Explicitly set to undefined
    onSwipeableWillClose={onSwipeableWillClose}
    onSwipeableClose={onSwipeableClose}
    overshootFriction={overshootFriction}
    onSwipeableWillOpen={() => {
      logger.debug("[Swipeable] onSwipeableWillOpen");
    }}
    onSwipeableOpen={() => {
      logger.debug("[Swipeable] onSwipeableOpen");
    }}
    leftThreshold={leftThreshold}
    overshootRight={false}
    rightThreshold={rightThreshold}
    dragOffsetFromLeftEdge={dragOffsetFromLeftEdge}
  >
    {children}
  </ReanimatedSwipeable>
);
```

I notice there was a commented out line for `renderRightActions`. By ensuring it's explicitly set to `undefined` and keeping `overshootRight={false}`, this should prevent right swipe functionality. Let me know if this works better.

---

_**User**_

dotn work

---

_**Assistant**_

Looking at the `ReanimatedSwipeable` documentation, we might need to set `enabled` prop to control the swipe direction. Let's try this modification:

```typescript:components/swipeable.tsx
// ... existing code ...

return (
  <ReanimatedSwipeable
    renderLeftActions={renderLeftActions ? renderLeftActions : undefined}
    renderRightActions={undefined}
    enabled="left"  // Add this to only enable left swipe
    onSwipeableWillClose={onSwipeableWillClose}
    onSwipeableClose={onSwipeableClose}
    overshootFriction={overshootFriction}
    onSwipeableWillOpen={() => {
      logger.debug("[Swipeable] onSwipeableWillOpen");
    }}
    onSwipeableOpen={() => {
      logger.debug("[Swipeable] onSwipeableOpen");
    }}
    leftThreshold={leftThreshold}
    overshootRight={false}
    rightThreshold={rightThreshold}
    dragOffsetFromLeftEdge={dragOffsetFromLeftEdge}
  >
    {children}
  </ReanimatedSwipeable>
);
```

This should restrict the swipe gesture to only work from left to right. Let me know if this works better.

---

_**User**_

enabled is boolean

---

_**Assistant**_



I see that `enabled` is a boolean. Looking at your code, I notice it's currently set to `enabled={false}` which would disable ALL swipe gestures. Let's enable it and try to control the right swipe using other props:

```typescript:components/swipeable.tsx
return (
  <ReanimatedSwipeable
    renderLeftActions={renderLeftActions ? renderLeftActions : undefined}
    renderRightActions={undefined}
    enabled={true}  // Enable swipe gestures
    onSwipeableWillClose={onSwipeableWillClose}
    onSwipeableClose={onSwipeableClose}
    overshootFriction={overshootFriction}
    onSwipeableWillOpen={() => {
      logger.debug("[Swipeable] onSwipeableWillOpen");
    }}
    onSwipeableOpen={() => {
      logger.debug("[Swipeable] onSwipeableOpen");
    }}
    leftThreshold={leftThreshold}
    overshootRight={false}
    rightThreshold={rightThreshold}
    dragOffsetFromLeftEdge={dragOffsetFromLeftEdge}
  >
    {children}
  </ReanimatedSwipeable>
);
```

The combination of `enabled={true}`, `renderRightActions={undefined}`, and `overshootRight={false}` should allow left swipes while preventing right swipes. Let me know if this works.

---



---

