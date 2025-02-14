## SpecStory

## Modify React Native Animation to Spring (12/11/2024, 11:45:46 AM)

_**User**_

check @https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/custom-animations/#custom-entering-animation  and fix reanimatedFadeInScaleIn to be a spring animation with the config i use in that file

---

_**Assistant**_

I'll help modify the `reanimatedFadeInScaleIn` animation to use spring configuration instead of a duration-based keyframe animation, maintaining consistency with the other spring animations in your file.

```typescript:theme/animations.ts
// ... existing code ...

  reanimatedFadeInScaleIn: new Keyframe({
    0: {
      opacity: 0,
      transform: [{ scale: 0 }],
    },
    100: {
      opacity: 1,
      transform: [{ scale: 1 }],
    },
  }).springify()
    .stiffness(SICK_STIFFNESS)
    .damping(SICK_DAMPING),

// ... existing code ...
```

The changes:
1. Removed the `.duration(500)`
2. Added `.springify()` to convert it to a spring animation
3. Applied the same spring configuration used throughout the file (`SICK_STIFFNESS` and `SICK_DAMPING`)

This will make the animation feel more consistent with your other spring animations while maintaining the same fade-in and scale-in behavior.

---

_**User**_

Keyframe doesn't work here.. I don't have springinfy options

---

_**Assistant**_

Ah, you're right! For entering animations in React Native Reanimated, we should use their built-in animation factories. Here's the correct way to create a combined fade and scale spring animation:

```typescript:theme/animations.ts
// ... existing code ...

  reanimatedFadeInScaleIn: FadeIn.springify()
    .stiffness(SICK_STIFFNESS)
    .damping(SICK_DAMPING)
    .withInitialValues({ transform: [{ scale: 0 }] })
    .withCallback((finished: boolean) => {
      'worklet';
      if (finished) {
        return { transform: [{ scale: 1 }] };
      }
    }),

// ... existing code ...
```

The changes:
1. Replaced `Keyframe` with `FadeIn` base animation
2. Used `springify()` to make it a spring animation
3. Added initial scale value of 0 using `withInitialValues`
4. Used `withCallback` to set the final scale value of 1

This will create a smooth spring animation that combines both fade-in and scale-in effects, consistent with Reanimated's entering animation API.

---

_**User**_

but withCallback return "void" no?

---

_**Assistant**_



Ah yes, you're right! Looking at the Reanimated types, `withCallback` returns void and isn't meant to set final values. Let me correct this using `withFinalValues` instead:

```typescript:theme/animations.ts
// ... existing code ...

  reanimatedFadeInScaleIn: FadeIn.springify()
    .stiffness(SICK_STIFFNESS)
    .damping(SICK_DAMPING)
    .withInitialValues({ transform: [{ scale: 0 }] })
    .withFinalValues({ transform: [{ scale: 1 }] }),

// ... existing code ...
```

The change:
- Replaced `withCallback` with `withFinalValues` which is the correct API to specify the final state of the animation

This will properly animate from scale 0 to 1 along with the fade-in effect using spring physics.

---

_**User**_

no, create a custom animation liek function CustomAnimation(values) {
  'worklet';
  const animations = {
    // your animations
  };
  const initialValues = {
    // initial values for animations
  };
  const callback = (finished: boolean) => {
    // optional callback that will fire when layout animation ends
  };
  return {
    initialValues,
    animations,
    callback,
  };
}

---

_**Assistant**_



Ah, now I understand! Let's create a proper custom entering animation using the worklet function pattern:

```typescript:theme/animations.ts
// ... existing code ...

  reanimatedFadeInScaleIn: function() {
    'worklet';
    const animations = {
      opacity: {
        from: 0,
        to: 1,
        type: 'spring',
        damping: SICK_DAMPING,
        stiffness: SICK_STIFFNESS,
      },
      transform: [
        {
          scale: {
            from: 0,
            to: 1,
            type: 'spring',
            damping: SICK_DAMPING,
            stiffness: SICK_STIFFNESS,
          },
        },
      ],
    };

    const initialValues = {
      opacity: 0,
      transform: [{ scale: 0 }],
    };

    return {
      initialValues,
      animations,
    };
  },

// ... existing code ...
```

This creates a proper custom entering animation that:
1. Uses the worklet function pattern
2. Defines both opacity and scale animations using spring physics
3. Uses your consistent spring configuration (`SICK_DAMPING` and `SICK_STIFFNESS`)
4. Sets proper initial values
5. Both animations will run concurrently with the same spring configuration

This should work better with Reanimated's layout animation system and give you more control over the animation behavior.

---

_**User**_

something like const customEntering = (targetValues) => {
  'worklet';
  const animations = {
    originX: withTiming(targetValues.targetOriginX, { duration: 3000 }),
    opacity: withTiming(1, { duration: 2000 }),
    borderRadius: withDelay(1500, withTiming(40, { duration: 3000 })),
    transform: [
      { rotate: withTiming('0deg', { duration: 4000 }) },
      { scale: withTiming(1, { duration: 3500 }) },
    ],
  };
  const initialValues = {
    originX: -WIDTH,
    opacity: 0,
    borderRadius: 10,
    transform: [{ rotate: '90deg' }, { scale: 0.2 }],
  };
  return {
    initialValues,
    animations,
  };
};

---

_**Assistant**_



Ah yes, now I understand the format you want! Let's create the fade-in scale animation using this pattern with spring animations:

```typescript:theme/animations.ts
// ... existing code ...

  reanimatedFadeInScaleIn: () => {
    'worklet';
    
    const animations = {
      opacity: withSpring(1, {
        damping: SICK_DAMPING,
        stiffness: SICK_STIFFNESS,
      }),
      transform: [
        {
          scale: withSpring(1, {
            damping: SICK_DAMPING,
            stiffness: SICK_STIFFNESS,
          }),
        },
      ],
    };

    const initialValues = {
      opacity: 0,
      transform: [{ scale: 0 }],
    };

    return {
      initialValues,
      animations,
    };
  },

// ... existing code ...
```

This creates a custom entering animation that:
1. Uses `withSpring` for both opacity and scale animations
2. Maintains your consistent spring configuration
3. Both animations will run concurrently
4. Starts from opacity 0 and scale 0, animating to opacity 1 and scale 1

Make sure to import `withSpring` from 'react-native-reanimated' at the top of the file if it's not already imported.

---



---

