## SpecStory

## Customizing Reusable Animation with Delay (12/12/2024, 4:01:20 PM)

_**User**_

I have this reuable animation in @animations.ts  but I'm trying to use it but also add some delay to it. Like I want to customize it, should i start adding some optional arguments or just recreate a new aniatmion in the file

reanimatedFadeInScaleIn: () => {
    "worklet";

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

---

_**Assistant**_

I'd recommend modifying the existing animation to accept optional parameters rather than creating a new one. This keeps the code DRY and makes the animation more flexible. Here's how you could update it:

```typescript:theme/animations.ts
// ... existing code ...

reanimatedFadeInScaleIn: (args?: { 
  delay?: number,
  damping?: number,
  stiffness?: number 
}) => {
  "worklet";
  
  const {
    delay = 0,
    damping = SICK_DAMPING,
    stiffness = SICK_STIFFNESS
  } = args ?? {};

  const animations = {
    opacity: withSpring(1, {
      damping,
      stiffness,
      delay
    }),
    transform: [
      {
        scale: withSpring(1, {
          damping,
          stiffness,
          delay
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

Then you can use it like this:

```typescript
// Default usage (no delay)
entering={animation.reanimatedFadeInScaleIn()}

// With delay
entering={animation.reanimatedFadeInScaleIn({ delay: 500 })}

// With custom spring configuration
entering={animation.reanimatedFadeInScaleIn({ 
  delay: 500,
  damping: 50,
  stiffness: 150
})}
```

This approach:
- Maintains a single source of truth
- Allows backward compatibility (existing code won't break)
- Provides flexibility to customize the animation when needed
- Keeps the default behavior when no arguments are provided

---



---

