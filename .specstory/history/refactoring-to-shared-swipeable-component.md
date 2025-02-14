## SpecStory

## Refactoring to Shared Swipeable Component (1/9/2025, 9:53:42 AM)

_**User**_

Possible to use @swipeable.tsx instead here. Let me know if there are nay props missing in @swipeable.tsx tha twe need to add to have the same comportment

---

_**Assistant**_

I'll help you refactor the `ConversationMessageRepliable` to use the shared `Swipeable` component. Looking at both implementations, we need to add a few props to the `Swipeable` component to match the current behavior.

Here are the changes needed for `components/swipeable.tsx`:

```typescript:components/swipeable.tsx
// ... existing imports ...

export type ISwipeableProps = {
  leftActionIcon: IIconName;
  onLeftSwipe?: () => void;
  onRightSwipe?: () => void;
  onLeftActionPress?: () => void;
  onWillLeftSwipe?: () => void;
  onRightActionPress?: () => void;
  onWillRightSwipe?: () => void;
  rightIsDestructive?: boolean;
  children: React.ReactNode;
  // New props needed
  overshootLeft?: boolean;
  dragOffsetFromLeftEdge?: number;
  customLeftActionsRenderer?: (progressAnimatedValue: Animated.AnimatedInterpolation<number>) => React.ReactNode;
};

export function Swipeable({
  // ... existing props ...
  overshootLeft,
  dragOffsetFromLeftEdge,
  customLeftActionsRenderer,
}: ISwipeableProps) {
  // ... existing code ...

  const renderLeftActions = useCallback(() => {
    if (customLeftActionsRenderer) {
      return customLeftActionsRenderer;
    }

    return (
      <RectButton style={themed($leftAction)} onPress={onLeftActionPress}>
        <Icon
          icon={leftActionIcon}
          color={themedInversePrimaryColor}
          size={iconSize.lg}
        />
      </RectButton>
    );
  }, [
    customLeftActionsRenderer,
    leftActionIcon,
    themed,
    themedInversePrimaryColor,
    iconSize.lg,
    onLeftActionPress,
  ]);

  return (
    <RNGestureSwipeable
      // ... existing props ...
      overshootLeft={overshootLeft}
      dragOffsetFromLeftEdge={dragOffsetFromLeftEdge}
    >
      {children}
    </RNGestureSwipeable>
  );
}
```

And here's how the `ConversationMessageRepliable` would be refactored to use the shared component:

```typescript:features/conversation/conversation-message/conversation-message-repliable.tsx
import { Icon } from "@design-system/Icon/Icon";
import { Swipeable } from "@/components/swipeable";
import { useAppTheme } from "@theme/useAppTheme";
import { Haptics } from "@utils/haptics";
import { memo } from "react";
import { Animated } from "react-native";

type IProps = {
  children: React.ReactNode;
  onReply: () => void;
};

export const ConversationMessageRepliable = memo(
  function ConversationMessageRepliable({ children, onReply }: IProps) {
    const { theme } = useAppTheme();
    const dragOffsetFromLeftEdge = theme.spacing.xs;
    const xTresholdToReply = theme.spacing["3xl"];

    return (
      <Swipeable
        leftActionIcon="arrowshape.turn.up.left.fill"
        overshootLeft
        dragOffsetFromLeftEdge={dragOffsetFromLeftEdge}
        onWillLeftSwipe={() => {
          Haptics.successNotificationAsync();
          onReply();
        }}
        customLeftActionsRenderer={(progressAV) => (
          <Animated.View
            style={{
              height: "100%",
              justifyContent: "center",
              paddingLeft: theme.spacing.sm,
              opacity: progressAV.interpolate({
                inputRange: [0, 0.7, 1],
                outputRange: [0, 0, 1],
              }),
              transform: [
                {
                  scale: progressAV.interpolate({
                    inputRange: [0, 0.7, 1],
                    outputRange: [0, 0, 1],
                    extrapolate: "clamp",
                  }),
                },
                {
                  translateX: progressAV.interpolate({
                    inputRange: [0, 0.8, 1],
                    outputRange: [0, 0, 0],
                    extrapolate: "clamp",
                  }),
                },
              ],
            }}
          >
            <Icon size={theme.iconSize.sm} icon="arrowshape.turn.up.left.fill" />
          </Animated.View>
        )}
      >
        {children}
      </Swipeable>
    );
  }
);
```

The main changes are:
1. Added `overshootLeft`, `dragOffsetFromLeftEdge`, and `customLeftActionsRenderer` props to the shared Swipeable component
2. Simplified the ConversationMessageRepliable by removing the ref and using the shared component
3. Moved the animation logic to be handled through the `customLeftActionsRenderer` prop
4. Used `onWillLeftSwipe` for the reply action instead of the previous custom logic

The behavior should remain the same while reusing more shared code.

---

_**User**_

instead of "customLeftActionsRenderer" create leftComponent and rightComponent, and remove leftActionIcon and rightIsDesctructive. The parent will instead pass those component to those props. for what had for left and right like the <RectButton ....> just create new component in the file that we will export 

---

_**Assistant**_

I'll help refactor the `Swipeable` component to use component props instead. Here's the updated version:

```typescript:components/swipeable.tsx
import { useAppTheme } from "@/theme/useAppTheme";
import { Icon } from "@design-system/Icon/Icon";
import React, { useCallback } from "react";
import { RectButton } from "react-native-gesture-handler";
import RNGestureSwipeable from "react-native-gesture-handler/Swipeable";
import {
  $leftAction,
  $rightAction,
  $rightActionRed,
} from "../features/conversation-list/components/conversation-list-item";

export type ISwipeableProps = {
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  onLeftSwipe?: () => void;
  onRightSwipe?: () => void;
  onLeftActionPress?: () => void;
  onWillLeftSwipe?: () => void;
  onRightActionPress?: () => void;
  onWillRightSwipe?: () => void;
  children: React.ReactNode;
  overshootLeft?: boolean;
  dragOffsetFromLeftEdge?: number;
};

export function SwipeableLeftAction({ 
  icon, 
  onPress 
}: { 
  icon: IIconName; 
  onPress?: () => void;
}) {
  const { themed, theme } = useAppTheme();
  return (
    <RectButton style={themed($leftAction)} onPress={onPress}>
      <Icon
        icon={icon}
        color={theme.colors.fill.inverted.primary}
        size={theme.iconSize.lg}
      />
    </RectButton>
  );
}

export function SwipeableRightAction({ 
  isDestructive,
  onPress 
}: { 
  isDestructive?: boolean;
  onPress?: () => void;
}) {
  const { themed, theme } = useAppTheme();
  return (
    <RectButton 
      style={themed(isDestructive ? $rightActionRed : $rightAction)} 
      onPress={onPress}
    >
      <Icon
        icon={isDestructive ? "trash" : "checkmark"}
        color={isDestructive ? "white" : theme.colors.fill.inverted.primary}
        size={theme.iconSize.lg}
      />
    </RectButton>
  );
}

export function Swipeable({
  leftComponent,
  rightComponent,
  onLeftSwipe,
  onRightSwipe,
  onLeftActionPress,
  onWillLeftSwipe,
  onRightActionPress,
  onWillRightSwipe,
  overshootLeft,
  dragOffsetFromLeftEdge,
  children,
}: ISwipeableProps) {
  const renderLeftActions = useCallback(() => leftComponent, [leftComponent]);
  const renderRightActions = useCallback(() => rightComponent, [rightComponent]);

  const onSwipeableWillClose = useCallback(
    (direction: "left" | "right") => {
      if (direction === "left") {
        onWillLeftSwipe?.();
      } else {
        onWillRightSwipe?.();
      }
    },
    [onWillLeftSwipe, onWillRightSwipe]
  );

  const onSwipeableClose = useCallback(
    (direction: "left" | "right") => {
      if (direction === "left") {
        onLeftSwipe?.();
      } else {
        onRightSwipe?.();
      }
    },
    [onLeftSwipe, onRightSwipe]
  );

  return (
    <RNGestureSwipeable
      renderRightActions={rightComponent ? renderRightActions : undefined}
      renderLeftActions={leftComponent ? renderLeftActions : undefined}
      leftThreshold={10000}
      overshootFriction={4}
      onSwipeableWillClose={onSwipeableWillClose}
      onSwipeableClose={onSwipeableClose}
      hitSlop={{ left: -6 }}
      overshootLeft={overshootLeft}
      dragOffsetFromLeftEdge={dragOffsetFromLeftEdge}
    >
      {children}
    </RNGestureSwipeable>
  );
}
```

And here's how the `ConversationMessageRepliable` would use it:

```typescript:features/conversation/conversation-message/conversation-message-repliable.tsx
import { Swipeable } from "@/components/swipeable";
import { Icon } from "@design-system/Icon/Icon";
import { useAppTheme } from "@theme/useAppTheme";
import { Haptics } from "@utils/haptics";
import { memo } from "react";
import { Animated } from "react-native";

type IProps = {
  children: React.ReactNode;
  onReply: () => void;
};

export const ConversationMessageRepliable = memo(
  function ConversationMessageRepliable({ children, onReply }: IProps) {
    const { theme } = useAppTheme();
    const dragOffsetFromLeftEdge = theme.spacing.xs;

    const leftComponent = (progressAV: Animated.AnimatedInterpolation<number>) => (
      <Animated.View
        style={{
          height: "100%",
          justifyContent: "center",
          paddingLeft: theme.spacing.sm,
          opacity: progressAV.interpolate({
            inputRange: [0, 0.7, 1],
            outputRange: [0, 0, 1],
          }),
          transform: [
            {
              scale: progressAV.interpolate({
                inputRange: [0, 0.7, 1],
                outputRange: [0, 0, 1],
                extrapolate: "clamp",
              }),
            },
            {
              translateX: progressAV.interpolate({
                inputRange: [0, 0.8, 1],
                outputRange: [0, 0, 0],
                extrapolate: "clamp",
              }),
            },
          ],
        }}
      >
        <Icon size={theme.iconSize.sm} icon="arrowshape.turn.up.left.fill" />
      </Animated.View>
    );

    return (
      <Swipeable
        overshootLeft
        dragOffsetFromLeftEdge={dragOffsetFromLeftEdge}
        onWillLeftSwipe={() => {
          Haptics.successNotificationAsync();
          onReply();
        }}
        leftComponent={leftComponent}
      >
        {children}
      </Swipeable>
    );
  }
);
```

The main changes:
1. Removed `leftActionIcon` and `rightIsDestructive` props
2. Added `SwipeableLeftAction` and `SwipeableRightAction` components that can be used as convenient pre-styled actions
3. Added `leftComponent` and `rightComponent` props that accept React nodes
4. Simplified the rendering logic in the main `Swipeable` component

Now consumers can either use the pre-built action components (`SwipeableLeftAction` and `SwipeableRightAction`) or provide their own custom components through the `leftComponent` and `rightComponent` props.

---



---

