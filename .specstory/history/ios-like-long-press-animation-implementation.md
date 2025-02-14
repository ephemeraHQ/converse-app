## SpecStory

## iOS-like Long Press Animation Implementation (2/7/2025, 3:24:29 PM)

_**User**_

for the long press i want animation like Apple ocntext menu where the element scale down a little and then scale up a little to trigger the thing 

---

_**Assistant**_

I'll help you modify the ConversationMessageGestures component to add an iOS-like context menu animation. We'll adjust the scale animation values and timing to match Apple's behavior.

```typescript:features/conversation/conversation-message/conversation-message-gestures.tsx
// ... existing imports and constants ...

// Add these constants for animation
const SCALE_DOWN_VALUE = 0.94; // Initial scale down
const SCALE_UP_VALUE = 1.02;   // Final scale up
const SCALE_DURATION = 250;    // Animation duration in ms

export const ConversationMessageGestures = memo(
  function ConversationMessageGestures(args: IMessageGesturesProps) {
    // ... existing destructuring and hooks ...

    const longPress = Gesture.LongPress()
      .onStart((e) => {
        Haptics.softImpactAsyncAnimated();
        
        // First scale down quickly
        scaleAV.value = withTiming(SCALE_DOWN_VALUE, {
          duration: SCALE_DURATION / 2,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });

        // Then scale up slightly
        scaleAV.value = withTiming(SCALE_UP_VALUE, {
          duration: SCALE_DURATION,
          easing: Easing.bezier(0.33, 1, 0.68, 1),
        });

        const measured = measure(containerRef);
        if (!measured) return;
        if (onLongPress) {
          runOnJS(onLongPress)({ ...e, ...measured });
        }
      })
      .onFinalize(() => {
        scaleAV.value = withTiming(1, {
          duration: SCALE_DURATION,
          easing: Easing.bezier(0.33, 1, 0.68, 1),
        });
      })
      .minDuration(MESSAGE_GESTURE_LONG_PRESS_MIN_DURATION)
      .hitSlop(theme.spacing.xs);

    // ... existing gesture composition ...

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: scaleAV.value }],
      };
    });

    return (
      <GestureDetector gesture={composed}>
        <AnimatedHStack
          ref={containerRef}
          style={animatedStyle} {/* Uncomment this line */}
        >
          {children}
        </AnimatedHStack>
      </GestureDetector>
    );
  }
);
```

The key changes are:

1. Added new constants for the scale animation values and timing
2. Modified the longPress gesture handler to:
   - First scale down to 0.94
   - Then scale up to 1.02
   - Use proper easing curves for smooth iOS-like animation
3. Added the animation reset in onFinalize
4. Uncommented and updated the animatedStyle to use the scaleAV shared value

This will create a smooth animation where the element first shrinks slightly and then expands a bit when long-pressed, similar to iOS's context menu animation. The element will smoothly animate back to its original size when released.

---



---

