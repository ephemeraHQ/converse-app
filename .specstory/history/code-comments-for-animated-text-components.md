## SpecStory

## Code Comments for Animated Text Components (1/29/2025, 1:48:30 PM)

_**User**_

add small comments block for each component because one is wrapper of claissic Text component with reaniimated and other one let us pass the text value as SharedValue to change it rapidely and performanyly

---

_**Assistant**_

I'll add comments to explain both components. Here's the updated code:

```typescript:design-system/Text/AnimatedText.tsx
// ... existing code ...

// A wrapper component that makes the base Text component compatible with Reanimated
// Useful for animating text properties like color, opacity, or transform
export const AnimatedText = Animated.createAnimatedComponent(Text);

type IAnimatableTextProps = ITextProps & {
  text: SharedValue<string>;
};

// A specialized text component that efficiently updates text content using SharedValue
// Optimized for frequent text changes without causing re-renders
// Uses react-native-animateable-text under the hood for better performance
export function AnimatableText({ style, text, ...rest }: IAnimatableTextProps) {
  // ... existing code ...
}
```

I've added clear, concise comments above each component explaining their purpose and benefits:
1. `AnimatedText` - explains it's a wrapper for Reanimated compatibility
2. `AnimatableText` - describes its purpose for efficient text updates and performance benefits

---



---

