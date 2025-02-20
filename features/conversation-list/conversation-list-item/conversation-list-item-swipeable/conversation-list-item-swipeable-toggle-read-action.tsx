import { ISwipeableRenderActionsArgs } from "@/components/swipeable";
import { useConversationIsUnread } from "@/features/conversation-list/hooks/use-conversation-is-unread";
import { useAppTheme } from "@/theme/use-app-theme";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import React, { memo, useState } from "react";
import { runOnJS, useAnimatedReaction } from "react-native-reanimated";
import { ConversationListItemSwipeableAction } from "./conversation-list-item-swipeable-action";

type IconType = "checkmark.message" | "message.badge";

export const ToggleUnreadSwipeableAction = memo(
  (props: ISwipeableRenderActionsArgs & { topic: ConversationTopic }) => {
    const { progressAnimatedValue, topic } = props;
    const { theme } = useAppTheme();
    const { isUnread } = useConversationIsUnread({ topic });

    // Track which icon to display. Needed to control when the icon changes
    const [displayIcon, setDisplayIcon] = useState<IconType>(
      isUnread ? "checkmark.message" : "message.badge"
    );

    // Only update the icon when the swipe animation is almost complete (progress < 0.1)
    // This prevents the icon from changing while the swipe action is still visible
    useAnimatedReaction(
      () => progressAnimatedValue.value,
      (currentValue) => {
        if (currentValue < 0.1) {
          runOnJS(setDisplayIcon)(
            isUnread ? "checkmark.message" : "message.badge"
          );
        }
      },
      [isUnread]
    );

    return (
      <ConversationListItemSwipeableAction
        icon={displayIcon}
        color={theme.colors.fill.secondary}
        iconColor={theme.colors.global.white}
        actionProgress={progressAnimatedValue}
      />
    );
  }
);
