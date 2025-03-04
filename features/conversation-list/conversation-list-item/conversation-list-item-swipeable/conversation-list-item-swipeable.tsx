import React, { memo } from "react"
import { ISwipeableProps, Swipeable } from "@/components/swipeable"
import { useAppTheme } from "@/theme/use-app-theme"
import { useConversationListItemSwipeableStyles } from "./conversation-list-item-swipeable.styles"

export const ConversationListItemSwipeable = memo(({ children, ...props }: ISwipeableProps) => {
  const { theme } = useAppTheme()

  const { swipeThreshold } = useConversationListItemSwipeableStyles()

  return (
    <Swipeable
      closeOnOpen
      leftThreshold={swipeThreshold}
      rightThreshold={swipeThreshold}
      leftActionsBackgroundColor={theme.colors.fill.caution}
      rightActionsBackgroundColor={theme.colors.fill.secondary}
      {...props}
    >
      {children}
    </Swipeable>
  )
})
