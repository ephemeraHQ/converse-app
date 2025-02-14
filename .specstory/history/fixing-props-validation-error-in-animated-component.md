## SpecStory

## Fixing Props Validation Error in Animated Component (11/7/2024, 8:25:05 AM)

_**User**_

why we have "'animatedProps' is missing in props validation"

---

_**Assistant**_

The error occurs because the type definition for `AnimatedBlurViewComponent` doesn't properly include the `animatedProps` in its props validation. Let's fix this by adjusting the types:

```typescript:components/AnimatedBlurView.tsx
// ... existing imports ...

type IAnimatedBlurProps = {
  intensity?: number;
};

type IAnimatedBlurViewProps = ViewProps &
  BlurViewProps & {
    animatedProps?: AnimatedProps<ViewProps & BlurViewProps & IAnimatedBlurProps>;
  };

const AnimatedBlurViewComponent = Animated.createAnimatedComponent(
  Platform.OS === "ios" ? BlurView : View
);

export const AnimatedBlurView: React.FC<IAnimatedBlurViewProps> = ({
  animatedProps,
  ...props
}) => {
  return <AnimatedBlurViewComponent {...props} animatedProps={animatedProps} />;
};
```

The key changes are:

1. Renamed types to follow your convention (adding 'I' prefix)
2. Modified the `animatedProps` type to include all possible props that can be animated (`ViewProps & BlurViewProps & IAnimatedBlurProps`)

The error was happening because the `AnimatedProps` generic type wasn't including all the possible props that could be animated. By extending it to include `ViewProps & BlurViewProps`, we ensure that all possible animated properties are properly typed.

---



---

