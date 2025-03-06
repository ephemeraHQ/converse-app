import React, { memo } from "react"
import { ViewStyle } from "react-native"
import { AnimatedCenter, Center } from "@/design-system/Center"
import { ITextProps, Text } from "@/design-system/Text"
import { TouchableHighlight } from "@/design-system/touchable-highlight"
import { VStack } from "@/design-system/VStack"
import { useConversationListStyles } from "@/features/conversation/conversation-list/conversation-list.styles"
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme"

export type IConversationListItemProps = {
  title?: string | React.ReactNode
  subtitle?: string | React.ReactNode
  avatarComponent?: React.ReactNode
  onPress?: () => void
  isUnread?: boolean
  showError?: boolean
}

export const ConversationListItem = memo(function ConversationListItem({
  onPress,
  isUnread,
  title,
  subtitle,
  avatarComponent,
  showError,
}: IConversationListItemProps) {
  const { themed, theme } = useAppTheme()
  const { screenHorizontalPadding } = useConversationListStyles()

  return (
    <TouchableHighlight
      onPress={onPress}
      style={[themed($container), { paddingHorizontal: screenHorizontalPadding }]}
    >
      <>
        <Center style={$avatarWrapper}>{avatarComponent}</Center>
        <VStack style={themed($messagePreviewContainer)}>
          {typeof title === "string" ? (
            <ConversationListItemTitle>{title}</ConversationListItemTitle>
          ) : (
            title
          )}
          {typeof subtitle === "string" ? (
            <ConversationListItemSubtitle>{subtitle}</ConversationListItemSubtitle>
          ) : (
            subtitle
          )}
        </VStack>
        {(isUnread || showError) && (
          <AnimatedCenter
            entering={theme.animation.reanimatedFadeInScaleIn()}
            exiting={theme.animation.reanimatedFadeOutScaleOut()}
            style={themed($unreadContainer)}
          >
            <Center style={[themed($unread), (!isUnread || showError) && themed($placeholder)]} />
          </AnimatedCenter>
        )}
      </>
    </TouchableHighlight>
  )
})

export const ConversationListItemTitle = memo(function ConversationListItemTitle(
  props: ITextProps,
) {
  return <Text preset="bodyBold" weight="medium" numberOfLines={1} {...props} />
})

export const ConversationListItemSubtitle = memo(function ConversationListItemSubtitle(
  props: ITextProps,
) {
  return <Text preset="small" color="secondary" numberOfLines={2} {...props} />
})

const $avatarWrapper: ViewStyle = {
  alignSelf: "center",
}

const $messagePreviewContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexGrow: 1,
  flexShrink: 1,
  marginLeft: spacing.xs,
})

const $unreadContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  marginLeft: spacing.xs,
})

const $unread: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  width: spacing.sm,
  height: spacing.sm,
  borderRadius: spacing.xs,
  backgroundColor: colors.fill.primary,
})

const $placeholder: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.global.transparent,
})

const $container: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingVertical: spacing.xs,
  backgroundColor: colors.background.surfaceless,
  flexDirection: "row",
})
