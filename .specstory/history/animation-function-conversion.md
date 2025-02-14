## SpecStory

## Animation Function Conversion (1/9/2025, 3:35:50 PM)

_**User**_

convert so it's lke the fadeinScaleIn

---

_**Assistant**_

I'll help convert the `reanimatedFadeOutScaleOut` to match the style of `reanimatedFadeInScaleIn`. Here's the updated code:

```typescript:theme/animations.ts
// ... existing code ...

  reanimatedFadeOutScaleOut:
    (args?: { delay?: number; damping?: number; stiffness?: number }) => () => {
      "worklet";

      const {
        delay,
        damping = SICK_DAMPING,
        stiffness = SICK_STIFFNESS,
      } = args ?? {};
      const springConfig = {
        damping,
        stiffness,
      };

      const animations = {
        opacity: delay
          ? withDelay(delay, withSpring(0, springConfig))
          : withSpring(0, springConfig),
        transform: [
          {
            scale: delay
              ? withDelay(delay, withSpring(0, springConfig))
              : withSpring(0, springConfig),
          },
        ],
      };

      const initialValues = {
        opacity: 1,
        transform: [{ scale: 1 }],
      };

      return {
        initialValues,
        animations,
      };
    },

// ... existing code ...
```

Key changes made:
1. Converted from Keyframe to a worklet function with spring animations
2. Made it accept the same parameters as `reanimatedFadeInScaleIn`
3. Reversed the animation values (1 → 0 instead of 0 → 1)
4. Uses the same spring configuration pattern
5. Removed the fixed duration of 500ms in favor of spring physics

The animation will now be consistent with `reanimatedFadeInScaleIn` but in reverse, using the same spring physics and configuration options.

---



---

