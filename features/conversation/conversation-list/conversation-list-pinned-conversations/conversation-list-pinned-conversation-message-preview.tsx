import { ViewStyle } from "react-native"
import { AnimatedHStack, HStack } from "@/design-system/HStack"
import { Text } from "@/design-system/Text"
import { useMessageContentStringValue } from "@/features/conversation/conversation-list/hooks/use-message-content-string-value"
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme"
import { captureError } from "@/utils/capture-error"
import { IConversationMessage } from "../../conversation-chat/conversation-message/conversation-message.types"

export type IPinnedConversationMessagePreviewProps = {
  message: IConversationMessage
}

export const PinnedConversationMessagePreview = (props: IPinnedConversationMessagePreviewProps) => {
  const { message } = props

  const { themed, theme } = useAppTheme()

  const textContent = useMessageContentStringValue(message)

  if (!textContent) {
    captureError
    return null
  }

  return (
    <HStack style={themed($containerStyle)}>
      <AnimatedHStack
        entering={theme.animation.reanimatedFadeInScaleIn()}
        exiting={theme.animation.reanimatedFadeOutScaleOut()}
        layout={theme.animation.reanimatedLayoutSpringTransition}
        style={themed($innerStyle)}
      >
        <Text numberOfLines={2} preset="smaller">
          {textContent}
        </Text>
      </AnimatedHStack>
    </HStack>
  )
}

const $containerStyle: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  position: "absolute",
  top: 0,
  left: -spacing.xs, // Make the preview message expand to the left
  right: -spacing.xs, // Make the preview message expand to the right
  justifyContent: "center",
})

const $innerStyle: ThemedStyle<ViewStyle> = ({ colors, borderRadius, borderWidth, spacing }) => ({
  backgroundColor: colors.background.raised,
  paddingHorizontal: spacing.xs,
  paddingVertical: spacing.xxs,
  alignSelf: "center",
  justifyContent: "center",
  alignItems: "center",
  borderRadius: borderRadius.sm,
  borderWidth: borderWidth.sm,
  borderColor: colors.border.subtle,
})
