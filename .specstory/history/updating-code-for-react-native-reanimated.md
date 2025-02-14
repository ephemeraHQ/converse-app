## SpecStory

## Updating Code for React Native Reanimated (1/9/2025, 10:48:31 AM)

_**User**_

fix to use interpolate from React-native-reanimetd

---

_**Assistant**_

I'll help you update the code to use the interpolate function from react-native-reanimated instead of React Native's Animated. Here's the necessary changes:

```typescript:features/conversation/conversation-message/conversation-message-repliable.tsx
import { Animated } from "react-native";
import { SharedValue, interpolate } from "react-native-reanimated";  // Update import

// ... existing code ...

    const renderLeftActions = (
      progressAV: SharedValue<number>
    ) => (
      <AnimatedVStack
        style={{
          height: "100%",
          justifyContent: "center",
          paddingLeft: theme.spacing.sm,
          opacity: interpolate(
            progressAV.value,
            [0, 0.7, 1],
            [0, 0, 1]
          ),
          transform: [
            {
              scale: interpolate(
                progressAV.value,
                [0, 0.7, 1],
                [0, 0, 1],
                { extrapolate: "clamp" }
              ),
            },
            {
              translateX: interpolate(
                progressAV.value,
                [0, 0.8, 1],
                [0, 0, 0],
                { extrapolate: "clamp" }
              ),
            },
          ],
        }}
      >
```

The changes involve:
1. Adding `interpolate` to the import from react-native-reanimated
2. Replacing the `.interpolate()` method calls with the `interpolate()` function
3. Using `progressAV.value` instead of `progressAV` directly
4. Moving `extrapolate` into an options object as the fourth parameter

The functionality remains the same, but now it's using the correct reanimated API.

---



---

