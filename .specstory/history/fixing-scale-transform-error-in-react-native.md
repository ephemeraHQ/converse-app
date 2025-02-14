## SpecStory

## Fixing Scale Transform Error in React Native (11/13/2024, 11:06:49 AM)

_**User**_

i get error here "transofmr with key of "scale" must be a number 

---

_**Assistant**_

This error occurs because the `interpolate` function returns an Animated.Value, but the transform style expects a plain number. For react-native-reanimated, we need to use `interpolate` from the Animated API differently.

Here's how to fix the transform section:

```typescript:components/Chat/Message/SwipeableMessageWrapper.tsx
// ... existing code ...
              transform: [
                {
                  scale: progressAnimatedValue.interpolate({
                    inputRange: [0, 0.8, 1],
                    outputRange: [0, 0, 1],
                    extrapolate: "clamp",
                  }) as unknown as number,
                },
                {
                  translateX: progressAnimatedValue.interpolate({
                    inputRange: [0, 0.8, 1],
                    outputRange: [0, 0, 8],
                    extrapolate: "clamp",
                  }) as unknown as number,
                },
              ],
// ... existing code ...
```

The fix involves type casting the interpolated value as `unknown as number` to satisfy TypeScript's type checking. This is safe in this context because we know the interpolation will produce numerical values at runtime.

Alternatively, if you're using react-native-reanimated, you could import and use its interpolate function instead:

```typescript:components/Chat/Message/SwipeableMessageWrapper.tsx
import { interpolate } from 'react-native-reanimated';

// ... existing code ...
              transform: [
                {
                  scale: interpolate(progressAnimatedValue, [0, 0.8, 1], [0, 0, 1]),
                },
                {
                  translateX: interpolate(progressAnimatedValue, [0, 0.8, 1], [0, 0, 8]),
                },
              ],
// ... existing code ...
```

Choose the approach that matches the animation library you're using in your project.

---



---

