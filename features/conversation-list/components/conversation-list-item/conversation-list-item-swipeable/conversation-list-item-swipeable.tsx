import { ISwipeableProps, Swipeable } from "@/components/swipeable";
import { useAppTheme } from "@/theme/useAppTheme";
import React, { memo } from "react";
import { useConversationListItemSwipeableStyles } from "./conversation-list-item-swipeable.styles";

export const ConversationListItemSwipeable = memo(
  ({ children, ...props }: ISwipeableProps) => {
    const { theme } = useAppTheme();

    const { swipeThreshold } = useConversationListItemSwipeableStyles();

    return (
      <Swipeable
        closeOnOpen
        leftThreshold={swipeThreshold}
        leftActionsBackgroundColor={theme.colors.fill.caution}
        rightActionsBackgroundColor={theme.colors.fill.minimal}
        {...props}
      >
        {children}
      </Swipeable>
    );
  }
);
