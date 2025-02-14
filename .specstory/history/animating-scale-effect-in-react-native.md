## SpecStory

## Animating Scale Effect in React Native (2/3/2025, 1:34:22 PM)

_**User**_

add some aniamtedStyle to ANimtedVstack that will scale a little bit the view and then once we .finzliat go back to initiali

---

_**Assistant**_

I'll help you add an animation to scale the view when long-pressed and return it to the initial scale when released. We'll use Reanimated's useAnimatedStyle and withSpring for smooth animations.

```typescript:design-system/context-menu/context-menu.ios.tsx
// ... existing code ...

const ContextMenuAlert = memo(function ContextMenuAlert(
  props: IContextMenuViewProps
) {
  const { menuConfig, onPressMenuItem, children, style } = props;

  // Add scale animation value
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const showActionSheet = useCallback(() => {
    showActionSheetWithOptions(
      {
        options: ["Cancel", "Delete"],
        cancelButtonIndex: 0,
        destructiveButtonIndex: 1,
      },
      () => {
        // Reset scale when action sheet is dismissed
        scale.value = withSpring(1);
        console.log("action sheet dismissed");
      }
    );
  }, []);

  const longPressGesture = Gesture.LongPress()
    .onStart((e) => {
      Haptics.softImpactAsyncAnimated();
      // Scale up when long press starts
      scale.value = withSpring(0.95);
      runOnJS(showActionSheet)();
    })
    .onFinalize(() => {
      // Reset scale when gesture ends
      scale.value = withSpring(1);
    });

  return (
    <GestureDetector gesture={longPressGesture}>
      <AnimatedVStack style={[style, animatedStyle]}>{children}</AnimatedVStack>
    </GestureDetector>
  );
});

// ... existing code ...
```

The changes include:
1. Added `useSharedValue` to manage the scale animation value
2. Created `animatedStyle` using `useAnimatedStyle` to apply the scale transform
3. Updated the scale value to 0.95 when long press starts
4. Added `onFinalize` handler to reset the scale
5. Added the `animatedStyle` to the `AnimatedVStack` styles array
6. Reset scale when action sheet is dismissed

Don't forget to import the necessary Reanimated functions at the top:
```typescript:design-system/context-menu/context-menu.ios.tsx
import { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
```

This will create a subtle "press" effect when the user long-presses the component, making the interaction more engaging and providing better visual feedback.

---



---

