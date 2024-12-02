import { Icon } from "@design-system/Icon/Icon";
import { ThemedStyle, useAppTheme } from "@theme/useAppTheme";
import { Haptics } from "@utils/haptics";
import { memo, useRef } from "react";
import { Animated, ViewStyle } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

// TODO: Switch to import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable"; once we upgrade to Expo SDK 52

// TODO: Once we have Expo SDK 52, let's redo to be more performant and use SharedValue to trigger the onReply etc...

// TODO: When we'll use ReanimatedSwipeable, we'll be able to listen to progress and trigger haptic once the treshold to reply is reached

type IProps = {
  children: React.ReactNode;
  onReply: () => void;
};

export const RepliableMessageWrapper = memo(function RepliableMessageWrapper({
  children,
  onReply,
}: IProps) {
  const { themed, theme } = useAppTheme();

  const swipeableRef = useRef<Swipeable>(null);
  const dragOffsetFromLeftEdge = theme.spacing.xs;
  const xTresholdToReply = theme.spacing["3xl"];

  return (
    <Swipeable
      overshootLeft
      hitSlop={{ left: -theme.spacing.md }}
      overshootFriction={8} // 8 makes it feel more real
      containerStyle={themed($container)}
      childrenContainerStyle={themed($childrenContainer)}
      dragOffsetFromLeftEdge={dragOffsetFromLeftEdge} // Default is 10
      leftThreshold={500} // Never trigger opening
      renderLeftActions={(progressAV) => {
        return (
          // TODO: Switch to AnimatedVStack once we upgrade to Expo SDK 52
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
            <Icon
              size={theme.iconSize.sm}
              icon="arrowshape.turn.up.left.fill"
            />
          </Animated.View>
        );
      }}
      onSwipeableWillClose={() => {
        const translation = swipeableRef.current?.state.rowTranslation;
        const translationValue = (translation as any)._value;
        const v = translationValue - dragOffsetFromLeftEdge;
        if (translation && v > xTresholdToReply) {
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

const $container: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: "100%",
  flexDirection: "row",
  overflow: "visible",
});

const $childrenContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: "100%",
  flexDirection: "row",
});
