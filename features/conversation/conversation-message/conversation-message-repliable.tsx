import { ISwipeableRenderActionsArgs, Swipeable } from "@/components/swipeable";
import { AnimatedVStack } from "@/design-system/VStack";
import { useConversationMessageStyles } from "@/features/conversation/conversation-message/conversation-message.styles";
import logger from "@/utils/logger";
import { Icon } from "@design-system/Icon/Icon";
import { useAppTheme } from "@theme/useAppTheme";
import { Haptics } from "@utils/haptics";
import { memo, useCallback } from "react";
import {
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

type IProps = {
  children: React.ReactNode;
  onReply: () => void;
  messageIsFromCurrentUser: boolean;
};

export const ConversationMessageRepliable = memo(
  function ConversationMessageRepliable({
    children,
    onReply,
    messageIsFromCurrentUser,
  }: IProps) {
    const { theme } = useAppTheme();

    const { messageContainerSidePadding, senderAvatarSize } =
      useConversationMessageStyles();

    const handleLeftSwipe = useCallback(() => {
      logger.debug("[ConversationMessageRepliable] onLeftSwipe");
      Haptics.successNotificationAsync();
      onReply();
    }, [onReply]);

    const renderLeftActions = useCallback(
      (args: ISwipeableRenderActionsArgs) => <SwipeReplyLeftAction {...args} />,
      []
    );

    return (
      <Swipeable
        closeOnOpen
        overshootFriction={10} // 10 feels like the iMessage reply swipe so we like it!
        // Prevent swipe conflict with back gesture for other users' messages
        leftHitSlop={
          !messageIsFromCurrentUser
            ? -(
                (messageContainerSidePadding + senderAvatarSize)
                // Allow swipe to trigger when starting a few pixels left of message. So don't add spaceBetweenSenderAvatarAndMessage
                // + spaceBetweenSenderAvatarAndMessage
              )
            : 0
        }
        dragOffsetFromLeftEdge={theme.spacing.xs}
        onLeftSwipe={handleLeftSwipe}
        renderLeftActions={renderLeftActions}
      >
        {children}
      </Swipeable>
    );
  }
);

const SwipeReplyLeftAction = memo(function SwipeReplyLeftAction({
  progressAnimatedValue,
}: ISwipeableRenderActionsArgs) {
  const { theme } = useAppTheme();

  const containerWidthAV = useSharedValue(0);

  // Trigger haptic feedback when we reached 100% of box width
  useAnimatedReaction(
    () => progressAnimatedValue.value,
    (progress, previousProgress) => {
      if (progress > 1 && (!previousProgress || previousProgress <= 1)) {
        Haptics.softImpactAsyncAnimated();
      }
    }
  );

  const as = useAnimatedStyle(() => {
    return {
      opacity: interpolate(progressAnimatedValue.value, [0, 0.7, 1], [0, 0, 1]),
      transform: [
        {
          scale: interpolate(
            progressAnimatedValue.value,
            [0, 0.7, 1],
            [0, 0, 1],
            "clamp"
          ),
        },
        {
          translateX: interpolate(
            progressAnimatedValue.value,
            [0, 0.8, 1],
            [0, 0, 0],
            "clamp"
          ),
        },
      ],
    };
  });

  return (
    <AnimatedVStack
      onLayout={({ nativeEvent }) => {
        containerWidthAV.value = nativeEvent.layout.width;
      }}
      style={[
        {
          height: "100%",
          justifyContent: "center",
          paddingLeft: theme.spacing.sm,
        },
        as,
      ]}
    >
      <Icon size={theme.iconSize.sm} icon="arrowshape.turn.up.left.fill" />
    </AnimatedVStack>
  );
});
