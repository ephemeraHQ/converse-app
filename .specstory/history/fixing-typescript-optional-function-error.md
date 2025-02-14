## SpecStory

## Fixing TypeScript Optional Function Error (1/9/2025, 2:30:58 PM)

_**User**_

why the error? the props looks like renderLeftActions?: (progressAnimatedValue: SharedValue<number>, dragAnimatedValue: SharedValue<number>, swipeable: SwipeableMethods) => React.ReactNode;. Can't we do what I did?

---

_**Assistant**_

The error occurs because `Parameters` utility type in TypeScript expects a function type, but `SwipeableProps["renderLeftActions"]` is an optional property (due to the `?`), which means it could be `undefined`. 

Here's how to fix it:

```typescript:components/swipeable.tsx
// ... existing code ...
export type ISwipeableRenderActionsArgs = Parameters<
  NonNullable<SwipeableProps["renderLeftActions"]>
>[0]
// ... existing code ...
```

The `NonNullable` utility type removes `undefined` from the type, allowing `Parameters` to work with the function type. This is necessary because we want to get the parameters of the function when it exists, not when it's undefined.

The resulting type will correctly capture the parameters of the `renderLeftActions` function: `SharedValue<number>` for the progress and drag values, and `SwipeableMethods` for the swipeable reference.

---

_**User**_

For the code present, we get this error:
```
Type 'MemoExoticComponent<(props: ISwipeableRenderActionsArgs) => Element>' is not assignable to type '((progressAnimatedValue: SharedValue<number>, dragAnimatedValue: SharedValue<number>, swipeable: SwipeableMethods) => ReactNode) | undefined'.
  Type 'MemoExoticComponent<(props: ISwipeableRenderActionsArgs) => Element>' is not assignable to type '(progressAnimatedValue: SharedValue<number>, dragAnimatedValue: SharedValue<number>, swipeable: SwipeableMethods) => ReactNode'.
    Types of parameters 'props' and 'progressAnimatedValue' are incompatible.
      Type 'SharedValue<number>' is missing the following properties from type 'ISwipeableRenderActionsArgs': progressAnimatedValue, dragAnimatedValue, swipeable
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error occurs because the memoized component expects a single props object, but `renderRightActions` expects individual parameters. Here's the fix:

```typescript:features/conversation-list/components/conversation-list-item/V3DMListItem.tsx
// ... existing code ...
    <Swipeable
      renderRightActions={(progress, drag, swipeable) => 
        RightSwipeableActions({ progressAnimatedValue: progress, dragAnimatedValue: drag, swipeable })}
      renderLeftActions={leftActions}
      onLeftSwipe={() => {
// ... existing code ...
```

This wraps the memoized component in a function that properly receives and passes the individual parameters as a props object.

---

_**User**_

For the code present, we get this error:
```
Type '{ value: number; get(): number; set(value: number | ((value: number) => number)): void; addListener: (listenerID: number, listener: (value: number) => void) => void; removeListener: (listenerID: number) => void; modify: (modifier?: (<T extends number>(value: T) => T) | undefined, forceUpdate?: boolean | undefined) =...' is missing the following properties from type 'ISwipeableRenderActionsArgs': progressAnimatedValue, dragAnimatedValue, swipeable
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_



The args need to be destructured into the correct format. Here's the fix:

```typescript:features/conversation-list/components/conversation-list-item/V3DMListItem.tsx
    <Swipeable
      renderRightActions={(progress, drag, swipeable) => 
        <RightSwipeableActions progressAnimatedValue={progress} dragAnimatedValue={drag} swipeable={swipeable} />}
      renderLeftActions={leftActions}
      onLeftSwipe={() => {
```

This properly passes the individual arguments as named props to the `RightSwipeableActions` component.

---



---

