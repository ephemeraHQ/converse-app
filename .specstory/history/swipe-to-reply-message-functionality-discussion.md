## SpecStory

## Swipe-to-Reply Message Functionality Discussion (11/13/2024, 11:03:43 AM)

_**User**_

help me with swipable props here, I don't think i need "onSwipeableWillClose" no?? What I want to do is to swipe to reply to message, so once we swipe left on a message and reach a certain distance, we should trigger the haptic and if the user release the swipe it calls a function where we will execute something

---

_**Assistant**_

I understand you want to implement a swipe-to-reply functionality that triggers when the user swipes left beyond a certain threshold. You're right - we can simplify this by using `onSwipeableWillOpen` instead of `onSwipeableWillClose`. Here's how to modify the Swipeable component:

```typescript:components/Chat/Message/SwipeableMessageWrapper.tsx
type ISwipeableMessageWrapperProps = {
  children: React.ReactNode;
  message: any; // Replace 'any' with your message type
  onReply: (message: any) => void;
};

export const SwipeableMessageWrapper = memo(function SwipeableMessageWrapper({
  children,
  message,
  onReply,
}: ISwipeableMessageWrapperProps) {
  const { themed, theme } = useAppTheme();
  const swipeableRef = useRef<Swipeable>(null);

  return (
    <Swipeable
      // ... existing props ...
      leftThreshold={70} // Set threshold for activation
      onSwipeableWillOpen={() => {
        Haptics.successNotificationAsync();
        onReply(message);
        swipeableRef.current?.close();
      }}
      ref={swipeableRef}
    >
      {children}
    </Swipeable>
  );
});
```

Key changes:
1. Removed `onSwipeableWillClose` and its complex translation check
2. Added `onReply` prop to handle the reply action
3. Set `leftThreshold` to 70 (or whatever threshold feels right for your UI)
4. Using `onSwipeableWillOpen` to trigger the reply action when threshold is reached
5. Added proper TypeScript props interface
6. Added `swipeableRef.current?.close()` to reset the swipe state after triggering

The component will now:
1. Trigger haptic feedback when swiped past threshold
2. Call the reply handler
3. Automatically close the swipe animation
4. Show the reply arrow animation while swiping (from your existing `renderLeftActions`)

You'll need to pass the message and onReply handler from the parent component:

```tsx
<SwipeableMessageWrapper 
  message={message} 
  onReply={(msg) => {
    converseEventEmitter.emit("triggerReplyToMessage", msg);
  }}
>
  {/* message content */}
</SwipeableMessageWrapper>
```

---

_**User**_

i dont want to close on open, i want to trigger the onReply only if the user release the swipeable and has reached the threshold

---

_**Assistant**_

Ah, I understand now! In this case, we should use `onSwipeableWillClose` to check the translation value when the user releases the swipe. Here's the corrected version:

```typescript:components/Chat/Message/SwipeableMessageWrapper.tsx
type ISwipeableMessageWrapperProps = {
  children: React.ReactNode;
  onReply: () => void;
};

export const SwipeableMessageWrapper = memo(function SwipeableMessageWrapper({
  children,
  onReply,
}: ISwipeableMessageWrapperProps) {
  const { themed, theme } = useAppTheme();
  const swipeableRef = useRef<Swipeable>(null);
  const SWIPE_THRESHOLD = 70;

  return (
    <Swipeable
      overshootLeft
      hitSlop={{ left: -theme.spacing.md }}
      overshootFriction={1.5}
      containerStyle={themed($container)}
      childrenContainerStyle={themed($childrenContainer)}
      renderLeftActions={/* ... existing renderLeftActions ... */}
      leftThreshold={10000} // Set very high to prevent auto-opening
      onSwipeableWillClose={() => {
        const translation = swipeableRef.current?.state.rowTranslation;
        if (translation && (translation as any)._value > SWIPE_THRESHOLD) {
          Haptics.successNotificationAsync();
          onReply();
        }
      }}
      ref={swipeableRef}
    >
      {children}
    </Swipeable>
  );
});
```

Key changes:
1. Added a `SWIPE_THRESHOLD` constant to make the threshold value clear and reusable
2. Set `leftThreshold` to a very high value (10000) to prevent the swipeable from auto-opening
3. Using `onSwipeableWillClose` to check the translation value when the user releases the swipe
4. If the translation is greater than the threshold, trigger the haptic feedback and call `onReply`

This way:
1. User can swipe left freely
2. When they release the swipe, we check if they swiped far enough
3. If they did swipe past the threshold, trigger the reply action
4. The swipeable will naturally animate back to its original position

---

_**User**_

can we track the swipe left value somwhree and use a useSharedValue?

---

_**Assistant**_



Yes! We can use a shared value to track the swipe progress and make it more reactive. Here's how to implement it:

```typescript:components/Chat/Message/SwipeableMessageWrapper.tsx
import { Icon } from "@design-system/Icon/Icon";
import { AnimatedVStack } from "@design-system/VStack";
import { ThemedStyle, useAppTheme } from "@theme/useAppTheme";
import { Haptics } from "@utils/haptics";
import { memo, useRef } from "react";
import { ViewStyle } from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import * as RNAnimated from "react-native-reanimated";
import { useSharedValue, runOnJS } from "react-native-reanimated";

type ISwipeableMessageWrapperProps = {
  children: React.ReactNode;
  onReply: () => void;
};

export const SwipeableMessageWrapper = memo(function SwipeableMessageWrapper({
  children,
  onReply,
}: ISwipeableMessageWrapperProps) {
  const { themed, theme } = useAppTheme();
  const swipeableRef = useRef<Swipeable>(null);
  const SWIPE_THRESHOLD = 70;
  
  const swipeProgress = useSharedValue(0);
  const hasTriggeredHaptic = useSharedValue(false);

  const handleSwipeProgress = (progress: number) => {
    swipeProgress.value = progress;
    
    // Trigger haptic when crossing threshold
    if (progress > SWIPE_THRESHOLD && !hasTriggeredHaptic.value) {
      hasTriggeredHaptic.value = true;
      Haptics.successNotificationAsync();
    } else if (progress < SWIPE_THRESHOLD) {
      hasTriggeredHaptic.value = false;
    }
  };

  return (
    <Swipeable
      overshootLeft
      hitSlop={{ left: -theme.spacing.md }}
      overshootFriction={1.5}
      containerStyle={themed($container)}
      childrenContainerStyle={themed($childrenContainer)}
      renderLeftActions={(
        progressAnimatedValue: RNAnimated.AnimatedInterpolation<string | number>
      ) => {
        // Track the swipe progress
        progressAnimatedValue.addListener(({ value }) => {
          runOnJS(handleSwipeProgress)(value);
        });

        return (
          <AnimatedVStack
            style={{
              opacity: progressAnimatedValue.interpolate({
                inputRange: [0, 0.7, 1],
                outputRange: [0, 0, 1],
              }),
              height: "100%",
              justifyContent: "center",
              transform: [
                {
                  translateX: progressAnimatedValue.interpolate({
                    inputRange: [0, 0.8, 1],
                    outputRange: [0, 0, 8],
                    extrapolate: "clamp",
                  }),
                },
              ],
            }}
          >
            <Icon icon="arrowshape.turn.up.left" />
          </AnimatedVStack>
        );
      }}
      leftThreshold={10000}
      onSwipeableWillClose={() => {
        if (swipeProgress.value > SWIPE_THRESHOLD) {
          onReply();
        }
        // Reset values
        swipeProgress.value = 0;
        hasTriggeredHaptic.value = false;
      }}
      ref={swipeableRef}
    >
      {children}
    </Swipeable>
  );
});
```

Key changes:
1. Added `swipeProgress` shared value to track the swipe distance
2. Added `hasTriggeredHaptic` shared value to prevent multiple haptic triggers
3. Created `handleSwipeProgress` function to manage the swipe progress and haptic feedback
4. Using `progressAnimatedValue.addListener` to track the swipe progress in real-time
5. Using `runOnJS` to safely call our JavaScript function from the UI thread
6. Reset the shared values when the swipe closes

This implementation gives you:
1. Real-time tracking of the swipe progress
2. Haptic feedback exactly when crossing the threshold
3. Clean reset of values after swipe completes
4. Better control over when to trigger the reply action

You could even use the `swipeProgress` value to add more visual feedback or animations based on the swipe progress if needed!

---



---

