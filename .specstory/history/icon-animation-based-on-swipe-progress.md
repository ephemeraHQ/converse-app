## SpecStory

## Icon Animation Based on Swipe Progress (1/9/2025, 2:46:45 PM)

_**User**_

fix this, the animated stfuf shouldn'T be on Pressable it should be around the icon so wrap icon with AnimatedCenter and we'll receive a props like iconProgressAV (find a better name, I want to say like when we reached the treshhold and it means we selected this action) and we have a const as = useAnimatedStyle that will return an interpolation to scale the icon 0.5 at 0 progress and 1 at 1 progress with clamp

---

_**Assistant**_

I'll help modify the code to animate the icon scaling based on the swipe progress. Here's the updated version:

```typescript:features/conversation-list/components/conversation-list-item/conversation-list-item-swipeable.tsx
// ... existing imports ...
import Animated, { useAnimatedStyle, interpolate, withSpring } from "react-native-reanimated";

type IConversationListItemSwipeableActionProps = {
  // ... existing props ...
  actionProgress: Animated.SharedValue<number>;
};

export function ConversationListItemSwipeableAction({
  icon,
  onPress,
  style,
  iconColor,
  iconProps,
  color,
  actionProgress,
}: IConversationListItemSwipeableActionProps) {
  const { themed, theme } = useAppTheme();

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{
      scale: interpolate(
        actionProgress.value,
        [0, 1],
        [0.5, 1],
        "clamp"
      )
    }]
  }));

  return (
    <Pressable
      style={[themed($actionContainer), style, { backgroundColor: color }]}
      onPress={onPress}
    >
      <Animated.View style={iconAnimatedStyle}>
        <Icon
          icon={icon}
          color={iconColor}
          size={theme.iconSize.lg}
          {...iconProps}
        />
      </Animated.View>
    </Pressable>
  );
}
```

Key changes made:
1. Added `actionProgress` SharedValue prop to control the animation
2. Removed `AnimatedPressable` in favor of regular `Pressable`
3. Added `useAnimatedStyle` to create a scaling animation for the icon
4. Wrapped `Icon` with `Animated.View` to apply the scaling animation
5. Icon will scale from 0.5 to 1 as the `actionProgress` goes from 0 to 1

The parent component will need to pass an `actionProgress` value that represents how close the swipe action is to being triggered (0 = not triggered, 1 = fully triggered).

---



---

