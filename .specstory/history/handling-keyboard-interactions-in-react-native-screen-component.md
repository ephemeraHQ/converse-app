## SpecStory

## Handling Keyboard Interactions in React Native Screen Component (10/2/2024, 2:26:42 PM)

_**User**_

ok Ive added useReanimatedKeyboardNimation from react-native-keyboard-controller BUT the problem is I don't want to always translateY... Like what if the textInput is already above the keyboard??? How can I fix that

---

_**Assistant**_

You're right, always applying a `translateY` transformation based on the keyboard height isn't ideal, especially when the input might already be above the keyboard. Let's modify the `Screen` component to handle this more intelligently. We'll use the `KeyboardControllerView` from `react-native-keyboard-controller` to manage the keyboard interactions more effectively.

Here's an updated version of the `Screen` component that addresses this issue:

```typescript:components/Screen/Screen.tsx
import { KeyboardControllerView, useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

export function Screen(props: ScreenProps) {
  const {
    backgroundColor = colors.background,
    KeyboardAvoidingViewProps,
    safeAreaEdges,
    StatusBarProps,
    statusBarStyle = "dark",
  } = props;

  const $containerInsets = useSafeAreaInsetsStyle(safeAreaEdges);

  const { height: keyboardHeight, progress } = useReanimatedKeyboardAnimation();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      paddingBottom: progress.value * keyboardHeight.value,
    };
  });

  return (
    <KeyboardControllerView
      style={[
        $containerStyle,
        { backgroundColor },
        $containerInsets,
      ]}
      {...KeyboardAvoidingViewProps}
    >
      <StatusBar style={statusBarStyle} {...StatusBarProps} />
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        {isNonScrolling(props.preset) ? (
          <ScreenWithoutScrolling {...props} />
        ) : (
          <ScreenWithScrolling {...props} />
        )}
      </Animated.View>
    </KeyboardControllerView>
  );
}
```

Here's what we've changed and why:

1. We've replaced `AnimatedVStack` with `KeyboardControllerView` from `react-native-keyboard-controller`. This component handles keyboard interactions more intelligently.

2. We're now using both `height` and `progress` from `useReanimatedKeyboardAnimation()`. The `progress` value represents how much of the keyboard is currently visible (0 to 1).

3. We've created an `animatedStyle` using `useAnimatedStyle` from `react-native-reanimated`. This style dynamically adjusts the `paddingBottom` of the content based on the keyboard height and visibility progress.

4. We've wrapped the content in an `Animated.View` that applies this `animatedStyle`.

5. We're no longer using a fixed `translateY` transformation. Instead, we're adjusting the `paddingBottom` of the content container.

This approach has several advantages:

- It smoothly adjusts the layout as the keyboard appears or disappears.
- It doesn't move content that's already above the keyboard.
- It works well with both fixed and scrolling content.
- It respects the natural flow of the layout instead of using absolute positioning.

Remember to import the necessary components and functions from `react-native-reanimated` at the top of your file:

```typescript
import Animated, { useAnimatedStyle } from "react-native-reanimated";
```

This solution should provide a more flexible and robust handling of keyboard interactions in your `Screen` component.

---



---

