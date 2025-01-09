/**
 * TODO(thierry): Maybe move this to components if we realise
 * we need to use it in other places than the conversation list
 */
import { ISwipeableRenderActionsArgs } from "@/components/swipeable";
import { AnimatedCenter, Center } from "@/design-system/Center";
import { IIconName, IIconProps } from "@/design-system/Icon/Icon.types";
import { useConversationIsUnreadByTopic } from "@/features/conversation-list/hooks/use-conversation-is-unread";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { Haptics } from "@/utils/haptics";
import { Icon } from "@design-system/Icon/Icon";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import React, { memo } from "react";
import { ViewStyle } from "react-native";
import {
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

type IConversationListItemSwipeableActionProps = {
  icon: IIconName;
  iconColor?: string;
  color: string;
  containerStyle?: ViewStyle;
  iconProps?: Partial<Omit<IIconProps, "icon" | "picto">>;
  actionProgress: SharedValue<number>;
};

export function ConversationListItemSwipeableAction({
  icon,
  containerStyle,
  iconColor,
  iconProps,
  color,
  actionProgress,
}: IConversationListItemSwipeableActionProps) {
  const { themed, theme } = useAppTheme();

  const scaleAV = useSharedValue(0.5);

  useAnimatedReaction(
    () => actionProgress.value >= 1,
    (shouldAnimate) => {
      if (shouldAnimate) {
        Haptics.softImpactAsyncAnimated();
        scaleAV.value = withSpring(1, {
          duration: theme.timing.veryFast,
        });
      } else {
        Haptics.softImpactAsyncAnimated();
        scaleAV.value = withSpring(0.6, {
          duration: theme.timing.veryFast,
        });
      }
    }
  );

  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleAV.value }],
    };
  });

  return (
    <Center
      style={[
        themed($actionContainer),
        containerStyle,
        { backgroundColor: color },
      ]}
    >
      <AnimatedCenter style={iconAnimatedStyle}>
        <Icon
          icon={icon}
          color={iconColor}
          size={theme.iconSize.md}
          {...iconProps}
        />
      </AnimatedCenter>
    </Center>
  );
}

const $actionContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: spacing["5xl"],
  alignItems: "center",
  justifyContent: "center",
});

export const ToggleUnreadSwipeableAction = memo(
  (props: ISwipeableRenderActionsArgs & { topic: ConversationTopic }) => {
    const { theme } = useAppTheme();

    const isUnread = useConversationIsUnreadByTopic({
      topic: props.topic,
    });

    return (
      <ConversationListItemSwipeableAction
        icon={isUnread ? "checkmark.message" : "message.badge"}
        color={theme.colors.fill.minimal}
        actionProgress={props.progressAnimatedValue}
      />
    );
  }
);

export const DeleteSwipeableAction = memo(
  (props: ISwipeableRenderActionsArgs) => {
    const { theme } = useAppTheme();

    return (
      <ConversationListItemSwipeableAction
        icon="trash"
        color={theme.colors.fill.caution}
        actionProgress={props.progressAnimatedValue}
        iconColor={theme.colors.fill.inverted.primary}
      />
    );
  }
);
