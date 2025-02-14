## SpecStory

## Simplifying Animation Logic in React Native (11/14/2024, 2:37:54 PM)

_**User**_

is there a cleaner way?

---

_**Assistant**_

Yes, we can simplify this animation logic using `useDerivedValue` which is more straightforward for this use case. Here's the cleaner version:

```typescript:components/Chat/Message/V3Message.tsx
// ... existing code ...

const MessageTime = memo(function MessageTime() {
  const { showTimeAV } = useMessageContext();

  const showTimeProgressAV = useDerivedValue(() => {
    return withTiming(showTimeAV.value ? 1 : 0, { duration: 1000 });
  });

  // ... rest of the component
```

This approach is cleaner because:
1. It removes the need for a separate `useSharedValue`
2. Eliminates the `useAnimatedReaction` hook which is typically used for more complex scenarios
3. The animation logic is more declarative and easier to understand
4. The derived value will automatically update whenever `showTimeAV.value` changes

The functionality remains exactly the same, but the code is more concise and follows better react-native-reanimated patterns.

---



---

