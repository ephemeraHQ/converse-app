## SpecStory

## TypeScript Interpolation Type Issue (11/13/2024, 1:22:54 PM)

_**User**_

transform with key of scale should be a number? BUT IT'S A NUMBEr

---

_**Assistant**_

This is likely a TypeScript type inference issue with react-native-reanimated's `interpolate` function. The interpolate function returns an `AnimatedNode`, but the transform style expects a number. We need to explicitly type the interpolation result as a number using `as unknown as number`.

Here's how to fix it:

```typescript:components/Chat/Message/SwipeableMessageWrapper.tsx
// ... existing code ...
              transform: [
                {
                  scale: progress.interpolate({
                    inputRange: [0, 0.8, 1],
                    outputRange: [0, 0, 1],
                    extrapolate: "clamp",
                  }) as unknown as number,
                },
                {
                  translateX: progress.interpolate({
                    inputRange: [0, 0.8, 1],
                    outputRange: [0, 0, 8],
                    extrapolate: "clamp",
                  }) as unknown as number,
                },
              ],
// ... existing code ...
```

This type assertion tells TypeScript that we know the interpolated value will eventually resolve to a number at runtime, even though during the animation it's actually an `AnimatedNode`. This is a common pattern when working with react-native-reanimated and TypeScript.

---



---

