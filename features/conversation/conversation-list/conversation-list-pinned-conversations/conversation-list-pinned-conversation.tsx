import { Center } from "@design-system/Center"
import { HStack } from "@design-system/HStack"
import { Text } from "@design-system/Text"
import { AnimatedVStack } from "@design-system/VStack"
import React, { FC, useCallback, useRef } from "react"
import { TextStyle, ViewStyle } from "react-native"
import { ContextMenuView, IContextMenuViewProps } from "@/design-system/context-menu/context-menu"
import { Pressable } from "@/design-system/Pressable"
import { useConversationListPinnedConversationsStyles } from "@/features/conversation/conversation-list/conversation-list-pinned-conversations/conversation-list-pinned-conversations.styles"
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme"
import logger from "@/utils/logger"

type IConversationListPinnedConversationProps = {
  avatarComponent: React.ReactNode
  onPress: () => void
  showUnread: boolean
  title: string
  contextMenuProps: Omit<IContextMenuViewProps, "children"> // Need this here because we want the context menu animation only to be around the avatar
}

export const ConversationListPinnedConversation: FC<IConversationListPinnedConversationProps> = ({
  avatarComponent,
  onPress,
  showUnread,
  title,
  contextMenuProps,
}) => {
  const { themed, theme } = useAppTheme()

  const menuWillShowRef = useRef(false)

  const { avatarSize } = useConversationListPinnedConversationsStyles()

  const handlePress = useCallback(() => {
    // Having this delay because right now there seems to be a bug when combining context menu and pressable.
    // https://github.com/dominicstop/react-native-ios-context-menu/issues/109
    setTimeout(() => {
      if (!menuWillShowRef.current) {
        onPress()
      } else {
        logger.debug("[ConversationListPinnedConversation] Saved a crash")
      }
    }, 100)
  }, [onPress])

  return (
    <AnimatedVStack
      style={[
        themed($container),
        {
          maxWidth: avatarSize,
        },
      ]}
    >
      <ContextMenuView
        hitSlop={theme.spacing.xs}
        {...contextMenuProps}
        style={[
          {
            borderRadius: 999,
          },
          contextMenuProps.style,
        ]}
        onMenuWillShow={() => {
          menuWillShowRef.current = true
        }}
        onMenuWillHide={() => {
          menuWillShowRef.current = false
        }}
      >
        <Pressable onPress={handlePress} delayLongPress={100}>
          <Center
            style={{
              borderRadius: 999,
            }}
          >
            {avatarComponent}
          </Center>
        </Pressable>
      </ContextMenuView>
      <HStack style={themed($bottomContainer)}>
        <Text preset="smaller" color="secondary" numberOfLines={1} style={themed($text)}>
          {title}
        </Text>
        {showUnread && <Center style={themed($indicator)} />}
      </HStack>
    </AnimatedVStack>
  )
}

const $container: ThemedStyle<ViewStyle> = (theme) => ({
  gap: theme.spacing.xxs,
  justifyContent: "center",
  alignItems: "center",
})

const $bottomContainer: ThemedStyle<ViewStyle> = (theme) => ({
  alignItems: "center",
  justifyContent: "center",
  gap: theme.spacing.xxxs,
  marginHorizontal: -theme.spacing.xxxs, // We allow the text to overflow a bit
})

const $indicator: ThemedStyle<ViewStyle> = (theme) => ({
  width: theme.spacing.xxs,
  height: theme.spacing.xxs,
  backgroundColor: theme.colors.text.primary,
  borderRadius: theme.spacing.xxxs,
  paddingLeft: theme.spacing.xxxs,
})

const $text: ThemedStyle<TextStyle> = (theme) => ({
  textAlign: "center",
})
