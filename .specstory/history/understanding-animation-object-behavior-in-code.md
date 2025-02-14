## SpecStory

## Understanding Animation Object Behavior in Code (9/26/2024, 4:17:06 PM)

_**User**_

can you tell me why it seesm that the withDelay change the original value in the object



---

_**Assistant**_

Based on the code you've provided, it appears that the `delay()` method is being called directly on the animation object, which could potentially modify the original animation object. This behavior might be unexpected and could lead to issues if you're reusing the same animation object elsewhere.

To explain why this happens and suggest a solution, let's break it down:

```typescript:screens/Onboarding/GetStartedScreen.tsx
<AnimatedVStack entering={animations.fadeInDownSpring.delay(500)}>
  {/* ... */}
</AnimatedVStack>
<PictoTitleSubtitle.Title
  entering={animations.fadeInDownSpring.delay(300)}
>
  {/* ... */}
</PictoTitleSubtitle.Title>
<PictoTitleSubtitle.Subtitle
  entering={animations.fadeInDownSpring.delay(200)}
>
  {/* ... */}
</PictoTitleSubtitle.Subtitle>
```

In this code, `animations.fadeInDownSpring.delay(500)` is called multiple times with different delay values. If `delay()` modifies the original object, each subsequent call would change the delay for all previous uses of the animation.

To fix this issue and ensure that each animation instance is independent, you should create a new animation object for each use. Here's how you can modify the code:

```typescript:screens/Onboarding/GetStartedScreen.tsx
<AnimatedVStack entering={animations.fadeInDownSpring().delay(500)}>
  {/* ... */}
</AnimatedVStack>
<PictoTitleSubtitle.Title
  entering={animations.fadeInDownSpring().delay(300)}
>
  {/* ... */}
</PictoTitleSubtitle.Title>
<PictoTitleSubtitle.Subtitle
  entering={animations.fadeInDownSpring().delay(200)}
>
  {/* ... */}
</PictoTitleSubtitle.Subtitle>
```

By calling `animations.fadeInDownSpring()` each time, you create a new instance of the animation, which can then be safely modified with `delay()` without affecting other uses of the same animation.

To support this change, you should modify the `animations` object in the `theme/animations.ts` file:

```typescript:theme/animations.ts
export const animations = {
  spring: {
    damping: SICK_DAMPING,
    stiffness: SICK_STIFFNESS,
  },

  fadeInDownSpring: () => FadeInDown.easing(SICK_EASE_OUT)
    .stiffness(SICK_STIFFNESS)
    .damping(SICK_DAMPING),
};
```

By making `fadeInDownSpring` a function that returns a new animation object each time it's called, you ensure that each use of the animation is independent and can be safely modified without affecting other instances.

This approach will prevent the unexpected behavior of the delay changing the original animation object and allow you to reuse the animation with different delays as needed.

---

_**User**_

other ways?

---

_**Assistant**_

Certainly! There are a few other approaches we could take to solve this issue. Here are some alternative solutions:

1. Create separate animation objects with different delays:

```typescript:theme/animations.ts
export const animations = {
  spring: {
    damping: SICK_DAMPING,
    stiffness: SICK_STIFFNESS,
  },

  fadeInDownSpring: FadeInDown.easing(SICK_EASE_OUT)
    .stiffness(SICK_STIFFNESS)
    .damping(SICK_DAMPING),

  fadeInDownSpringWithDelay: (delay: number) => FadeInDown.easing(SICK_EASE_OUT)
    .stiffness(SICK_STIFFNESS)
    .damping(SICK_DAMPING)
    .delay(delay),
};
```

Then in your component:

```typescript:screens/Onboarding/GetStartedScreen.tsx
<AnimatedVStack entering={animations.fadeInDownSpringWithDelay(500)}>
  {/* ... */}
</AnimatedVStack>
<PictoTitleSubtitle.Title
  entering={animations.fadeInDownSpringWithDelay(300)}
>
  {/* ... */}
</PictoTitleSubtitle.Title>
```

2. Use a higher-order function to create delayed animations:

```typescript:theme/animations.ts
const withDelay = (animation, delay) => {
  return animation.delay(delay);
};

export const animations = {
  // ... other animations ...
  fadeInDownSpring: FadeInDown.easing(SICK_EASE_OUT)
    .stiffness(SICK_STIFFNESS)
    .damping(SICK_DAMPING),
};
```

Then in your component:

```typescript:screens/Onboarding/GetStartedScreen.tsx
<AnimatedVStack entering={withDelay(animations.fadeInDownSpring, 500)}>
  {/* ... */}
</AnimatedVStack>
<PictoTitleSubtitle.Title
  entering={withDelay(animations.fadeInDownSpring, 300)}
>
  {/* ... */}
</PictoTitleSubtitle.Title>
```

3. Use a composition approach:

```typescript:theme/animations.ts
export const animations = {
  // ... other animations ...
  fadeInDownSpring: FadeInDown.easing(SICK_EASE_OUT)
    .stiffness(SICK_STIFFNESS)
    .damping(SICK_DAMPING),
  delay: (ms: number) => ({ delay: ms }),
};
```

Then in your component:

```typescript:screens/Onboarding/GetStartedScreen.tsx
<AnimatedVStack entering={Animated.compose(animations.fadeInDownSpring, animations.delay(500))}>
  {/* ... */}
</AnimatedVStack>
<PictoTitleSubtitle.Title
  entering={Animated.compose(animations.fadeInDownSpring, animations.delay(300))}
>
  {/* ... */}
</PictoTitleSubtitle.Title>
```

This approach assumes that the animation library you're using supports composition of animations. If it doesn't, you might need to implement a custom compose function.

4. Use a memoization technique:

```typescript:theme/animations.ts
import { useMemo } from 'react';

export const useDelayedAnimation = (animation, delay) => {
  return useMemo(() => animation.delay(delay), [animation, delay]);
};

export const animations = {
  // ... other animations ...
  fadeInDownSpring: FadeInDown.easing(SICK_EASE_OUT)
    .stiffness(SICK_STIFFNESS)
    .damping(SICK_DAMPING),
};
```

Then in your component:

```typescript:screens/Onboarding/GetStartedScreen.tsx
const fadeInDown500 = useDelayedAnimation(animations.fadeInDownSpring, 500);
const fadeInDown300 = useDelayedAnimation(animations.fadeInDownSpring, 300);

return (
  <>
    <AnimatedVStack entering={fadeInDown500}>
      {/* ... */}
    </AnimatedVStack>
    <PictoTitleSubtitle.Title entering={fadeInDown300}>
      {/* ... */}
    </PictoTitleSubtitle.Title>
  </>
);
```

Each of these approaches has its own trade-offs in terms of flexibility, reusability, and performance. The best choice depends on your specific use case and the overall architecture of your application.

---



---

