import { memo, useEffect } from "react"
import { Platform, StatusBar, useWindowDimensions } from "react-native"
import { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { AnimatedVStack, VStack } from "@/design-system/VStack"
import { useConversationMessageContextMenuStyles } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-context-menu/conversation-message-context-menu.styles"
import { useAppTheme } from "@/theme/use-app-theme"
import {
  MESSAGE_CONTEXT_MENU_ABOVE_MESSAGE_REACTIONS_HEIGHT,
  MESSAGE_CONTEXT_REACTIONS_HEIGHT,
} from "./conversation-message-context-menu.constants"

export const MessageContextMenuContainer = memo(function MessageContextMenuContainer(args: {
  children: React.ReactNode
  itemRectY: number
  itemRectX: number
  itemRectHeight: number
  itemRectWidth: number
  menuHeight: number
  fromMe: boolean
  hasReactions: boolean
}) {
  const { theme } = useAppTheme()
  const safeAreaInsets = useSafeAreaInsets()
  const translateYAV = useSharedValue(0)
  const { verticalSpaceBetweenSections } = useConversationMessageContextMenuStyles()
  const { height: windowHeight } = useWindowDimensions()

  const {
    itemRectY,
    itemRectX,
    itemRectHeight,
    itemRectWidth,
    menuHeight,
    fromMe,
    hasReactions,
    children,
  } = args

  useEffect(() => {
    const screenHeight = windowHeight
    const minTopOffset =
      MESSAGE_CONTEXT_MENU_ABOVE_MESSAGE_REACTIONS_HEIGHT +
      verticalSpaceBetweenSections +
      safeAreaInsets.top +
      (hasReactions
        ? MESSAGE_CONTEXT_REACTIONS_HEIGHT +
          // Small buffer to give space to reactors
          theme.spacing.xxl
        : 0)
    const containerBottom =
      itemRectY + itemRectHeight + verticalSpaceBetweenSections + menuHeight + safeAreaInsets.bottom

    let translateY = 0

    if (containerBottom > screenHeight) {
      // Not enough space at the bottom
      translateY = screenHeight - containerBottom
    } else if (itemRectY < minTopOffset) {
      // Not enough space at the top
      translateY = minTopOffset - itemRectY
    } else {
      translateY = 0 // Default position
    }

    translateYAV.value = withSpring(translateY, theme.animation.contextMenuSpring)
  }, [
    hasReactions,
    itemRectY,
    itemRectHeight,
    menuHeight,
    safeAreaInsets,
    theme,
    verticalSpaceBetweenSections,
    translateYAV,
    windowHeight,
  ])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateYAV.value }],
  }))

  // On Android, we need to account for the status bar height by moving the menu down
  const statusBarHeight = Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0

  const distanceFromTop =
    itemRectY -
    MESSAGE_CONTEXT_MENU_ABOVE_MESSAGE_REACTIONS_HEIGHT -
    verticalSpaceBetweenSections +
    (Platform.OS === "android" ? statusBarHeight : 0)

  return (
    <AnimatedVStack
      style={[
        {
          position: "absolute",
          top: distanceFromTop,
          left: 0,
          right: 0,
        },
        animatedStyle,
      ]}
    >
      <VStack
        // {...debugBorder()}
        style={{
          alignItems: fromMe ? "flex-end" : "flex-start",
          ...(fromMe
            ? { right: theme.layout.screen.width - itemRectX - itemRectWidth }
            : {
                left: itemRectX,
              }),
        }}
      >
        {children}
      </VStack>
    </AnimatedVStack>
  )
})
