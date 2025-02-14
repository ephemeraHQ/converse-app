## SpecStory

## Fluid Animation Enhancement for ArcLoader (1/29/2025, 10:20:13 AM)

_**User**_

inspire yoursefl from  this bounce to create the infinitei animation. It's more fluid

---

_**Assistant**_

I'll help modify the ArcLoader animation to be more fluid using a similar bounce-like timing sequence. Here's the updated code:

```typescript:features/conversation-list/conversation-list-loading.tsx
// ... existing code ...

const ArcLoader = () => {
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    const timingConfig = {
      duration: 1500, // Slower duration for smoother feel
    };
    
    rotation.value = withSequence(
      withTiming(0, timingConfig),
      withRepeat(
        withTiming(360, {
          duration: 1500,
          // Use bezier curve for smoother animation
          easing: Easing.bezier(0.35, 0.7, 0.5, 0.7),
        }),
        -1, // Infinite loop
        false // Don't reverse
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return <Animated.View style={[styles.arc, animatedStyle]} />;
};

// ... existing code ...
```

Key changes made:
1. Added `Easing.bezier()` for smoother motion
2. Increased duration to 1500ms for a more fluid feel
3. Used `withSequence` pattern similar to the bounce animation
4. Added initial timing to ensure smooth start

Don't forget to import `Easing` at the top of the file:
```typescript:features/conversation-list/conversation-list-loading.tsx
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
```

This will create a smoother, more fluid rotating animation for the arc loader.

---



---

