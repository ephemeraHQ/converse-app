import { memo, useCallback } from "react"
import { EntryAnimationsValues, withSpring } from "react-native-reanimated"
import {
  DropdownMenuContainer,
  DropdownMenuCustomItem,
  IDropdownMenuCustomItemProps,
} from "@/design-system/dropdown-menu/dropdown-menu-custom"
import { AnimatedVStack } from "@/design-system/VStack"
import { useConversationMessageContextMenuStyles } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-context-menu/conversation-message-context-menu.styles"
import { useAppTheme } from "@/theme/use-app-theme"
import { debugBorder } from "@/utils/debug-style"
import { MENU_ITEMS_WIDTH } from "./conversation-message-context-menu.constants"

export const MessageContextMenuItems = memo(function MessageContextMenuItems(props: {
  menuItems: IDropdownMenuCustomItemProps[]
  originY: number
  originX: number
}) {
  const { theme } = useAppTheme()

  const { menuItems: items, originY, originX } = props

  const { verticalSpaceBetweenSections } = useConversationMessageContextMenuStyles()

  const customEnteringAnimation = useCallback(
    (targetValues: EntryAnimationsValues) => {
      "worklet"

      const animations = {
        originX: withSpring(targetValues.targetOriginX, theme.animation.contextMenuSpring),
        originY: withSpring(targetValues.targetOriginY, theme.animation.contextMenuSpring),
        opacity: withSpring(1, theme.animation.contextMenuSpring),
        transform: [{ scale: withSpring(1, theme.animation.contextMenuSpring) }],
      }

      const initialValues = {
        originX: originX - MENU_ITEMS_WIDTH / 2,
        originY: originY,
        opacity: 0,
        transform: [{ scale: 0 }],
      }

      return {
        initialValues,
        animations,
      }
    },
    [theme.animation.contextMenuSpring, originX, originY],
  )

  return (
    <AnimatedVStack
      style={{ zIndex: -1, marginTop: verticalSpaceBetweenSections }}
      entering={customEnteringAnimation}
    >
      <DropdownMenuContainer>
        {items.map((item) => (
          <DropdownMenuCustomItem key={item.label} {...item} />
        ))}
      </DropdownMenuContainer>
      {/* <TableView
          items={items}
          style={{
            width: MENU_ITEMS_WIDTH,
            backgroundColor:
              Platform.OS === "android"
                ? theme.colors.background.raised
                : undefined,
            borderRadius: Platform.OS === "android" ? 10 : undefined,
          }}
        /> */}
    </AnimatedVStack>
  )
})
