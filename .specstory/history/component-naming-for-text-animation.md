## SpecStory

## Component Naming for Text Animation (1/29/2025, 1:16:15 PM)

_**User**_

i feel ti'S confusing here because i have 2 components. One is just a reacanimted wrapper around a Text and the other is another lib that let me pass AnimatedValue to the text so that i can change the value of text rapidely using UI thread. What could i name both

---

_**Assistant**_

Based on your code style guide and the need to differentiate between these two text animation components, here's a suggestion for clearer naming:

```typescript:design-system/Text/AnimatedText.tsx
// For React Native Reanimated wrapper
export const ReanimatedText = Animated.createAnimatedComponent(Text);

// For UI thread animated text (assuming this is for rapid text updates)
export const ThreadSafeAnimatedText = AnimateableText;
```

The reasoning behind these names:
- `ReanimatedText` clearly indicates it's using the Reanimated library
- `ThreadSafeAnimatedText` indicates that it's optimized for UI thread performance

You could also consider these alternative names if they better match your use cases:

```typescript:design-system/Text/AnimatedText.tsx
// Alternative naming options:
export const ReanimatedText = Animated.createAnimatedComponent(Text);
export const FastUpdateText = AnimateableText;

// Or:
export const AnimatedWrapperText = Animated.createAnimatedComponent(Text);
export const PerformantAnimatedText = AnimateableText;
```

Choose the naming that best describes the specific use case and makes it immediately clear to other developers which component to use for which purpose.

---



---

