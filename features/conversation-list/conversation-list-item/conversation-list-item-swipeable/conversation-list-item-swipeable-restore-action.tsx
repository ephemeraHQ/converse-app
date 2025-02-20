import { ISwipeableRenderActionsArgs } from "@/components/swipeable";
import { useAppTheme } from "@/theme/use-app-theme";
import React, { memo } from "react";
import { ConversationListItemSwipeableAction } from "./conversation-list-item-swipeable-action";

export const RestoreSwipeableAction = memo(
  (props: ISwipeableRenderActionsArgs) => {
    const { theme } = useAppTheme();

    return (
      <ConversationListItemSwipeableAction
        icon="restore"
        color={theme.colors.fill.tertiary}
        actionProgress={props.progressAnimatedValue}
        iconColor={theme.colors.global.white}
      />
    );
  }
);
