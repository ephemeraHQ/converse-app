## SpecStory

## Animation Function Update: Slide Up Effect (12/16/2024, 11:04:24 AM)

_**User**_

it needs to also come from bottom

---

_**Assistant**_

I'll modify the animation to make it slide up from the bottom while maintaining the fade and height animation. Here's the updated `customEntering` function:

```typescript:features/conversation/conversation-message-status/conversation-message-status.tsx
const customEntering = (values: { targetHeight: number }) => {
  "worklet";

  const animations = {
    height: withSpring(values.targetHeight, {
      damping: 15,
      stiffness: 90,
    }),
    opacity: withSpring(1),
    transform: [
      {
        translateY: withSpring(0, {
          damping: 15,
          stiffness: 90,
        }),
      },
    ],
  };

  const initialValues = {
    height: 0,
    opacity: 0,
    transform: [
      {
        translateY: 10, // Start 10 units below its final position
      },
    ],
  };

  return {
    initialValues,
    animations,
  };
};
```

The changes made:
1. Added `transform` array with `translateY` in both animations and initialValues
2. Initial `translateY` is set to 10 (moves up from below)
3. Animation brings `translateY` to 0 (final position)
4. Used the same spring configuration for consistency

This will create a smooth animation where the status message slides up from the bottom while fading in and expanding its height.

---



---

