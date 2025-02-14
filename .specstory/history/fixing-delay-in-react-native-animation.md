## SpecStory

## Fixing Delay in React Native Animation (12/11/2024, 12:30:11 PM)

_**User**_

i have this   reanimatedLayoutSpringTransition: LinearTransition.springify()
    .damping(SICK_DAMPING)
    .stiffness(SICK_STIFFNESS),

But when I do "theme.animation.reanimatedLayoutSpringTransition.delay(
              1000
            )" the delay isn't added, it won't work

---

_**Assistant**_

The issue is that the `LinearTransition.springify()` doesn't have a `delay` method directly available. To add a delay to a layout animation in react-native-reanimated, you need to use `withDelay` or modify how you create the transition.

Here's how you can fix this:

```typescript
// In your theme configuration
import { LinearTransition, withDelay } from 'react-native-reanimated';

// Define your transition
const baseTransition = LinearTransition.springify()
  .damping(SICK_DAMPING)
  .stiffness(SICK_STIFFNESS);

// Create a function that returns a delayed transition
function createDelayedTransition(delay: number) {
  return withDelay(delay, baseTransition);
}

// In your theme object
{
  animation: {
    reanimatedLayoutSpringTransition: baseTransition,
    createDelayedLayoutTransition: createDelayedTransition,
  }
}
```

Then in your component:

```typescript
<AnimatedVStack
  layout={theme.animation.createDelayedLayoutTransition(1000)}
  style={{
    rowGap: theme.spacing["4xs"],
    alignItems: fromMe ? "flex-end" : "flex-start",
  }}
>
  {children}
</AnimatedVStack>
```

This approach will properly apply the delay to your layout animation. The `withDelay` function is the correct way to add delays to Reanimated animations.

---



---

