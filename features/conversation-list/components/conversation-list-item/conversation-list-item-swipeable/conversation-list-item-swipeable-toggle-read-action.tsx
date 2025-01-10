import { ISwipeableRenderActionsArgs } from "@/components/swipeable";
import { useConversationIsUnreadByTopic } from "@/features/conversation-list/hooks/use-conversation-is-unread";
import { useAppTheme } from "@/theme/useAppTheme";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import React, { memo } from "react";
import { ConversationListItemSwipeableAction } from "./conversation-list-item-swipeable-action";

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
