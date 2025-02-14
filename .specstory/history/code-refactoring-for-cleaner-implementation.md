## SpecStory

## Code Refactoring for Cleaner Implementation (1/9/2025, 2:35:52 PM)

_**User**_

can we make this line cleaner?

---

_**Assistant**_

Yes, we can make this line cleaner by using a callback pattern similar to how `leftActions` is handled. Here's the suggested change:

```typescript:features/conversation-list/components/conversation-list-item/V3DMListItem.tsx
// ... existing code ...

  const rightActions = useCallback(
    (args: ISwipeableRenderActionsArgs) => <RightSwipeableActions {...args} />,
    []
  );

  return (
    <Swipeable
      renderRightActions={rightActions}
      renderLeftActions={leftActions}
      onLeftSwipe={() => {
        console.log("left swipe");
      }}
    >
// ... existing code ...
```

This change:
1. Makes the code more consistent with how `leftActions` is handled
2. Memoizes the render function to prevent unnecessary re-renders
3. Makes the JSX cleaner and easier to read
4. Properly types the arguments using `ISwipeableRenderActionsArgs`

---

_**User**_

For the code present, we get this error:
```
Type '((args: ISwipeableRenderActionsArgs) => ReactNode) | undefined' is not assignable to type '((progressAnimatedValue: SharedValue<number>, dragAnimatedValue: SharedValue<number>, swipeable: SwipeableMethods) => ReactNode) | undefined'.
  Type '(args: ISwipeableRenderActionsArgs) => ReactNode' is not assignable to type '(progressAnimatedValue: SharedValue<number>, dragAnimatedValue: SharedValue<number>, swipeable: SwipeableMethods) => ReactNode'.
    Types of parameters 'args' and 'progressAnimatedValue' are incompatible.
      Type 'SharedValue<number>' is not assignable to type 'ISwipeableRenderActionsArgs'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error occurs because `ReanimatedSwipeable` expects individual parameters while we're using an object. Here's the fix:

```typescript:components/swipeable.tsx
// ... existing code ...
      renderLeftActions={
        renderLeftActions
          ? (progress, drag, swipeable) =>
              renderLeftActions({ progressAnimatedValue: progress, dragAnimatedValue: drag, swipeable })
          : undefined
      }
      renderRightActions={
        renderRightActions
          ? (progress, drag, swipeable) =>
              renderRightActions({ progressAnimatedValue: progress, dragAnimatedValue: drag, swipeable })
          : undefined
      }
// ... existing code ...
```

This adapts between our object-based API and the library's parameter-based API.

---



---

