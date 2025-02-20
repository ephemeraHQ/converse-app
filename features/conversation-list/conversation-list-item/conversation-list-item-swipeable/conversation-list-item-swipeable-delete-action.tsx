import { ISwipeableRenderActionsArgs } from "@/components-name/swipeable";
import { useAppTheme } from "@/theme/use-app-theme";
import React, { memo } from "react";
import { ConversationListItemSwipeableAction } from "./conversation-list-item-swipeable-action";

export const DeleteSwipeableAction = memo(
  (props: ISwipeableRenderActionsArgs) => {
    const { theme } = useAppTheme();

    return (
      <ConversationListItemSwipeableAction
        icon="trash"
        color={theme.colors.fill.caution}
        actionProgress={props.progressAnimatedValue}
        iconColor={theme.colors.global.white}
      />
    );
  }
);
