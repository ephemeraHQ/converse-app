import { AnimatedHStack, HStack } from "@design-system/HStack"
import { Text } from "@design-system/Text"
import { VStack } from "@design-system/VStack"
import { memo, useCallback } from "react"
import { TextStyle, TouchableHighlight, ViewStyle } from "react-native"
import { useConversationMessageContextStoreContext } from "@/features/conversation/conversation-chat/conversation-message/conversation-message.store-context"
import { useSelect } from "@/stores/stores.utils"
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme"
import { openMessageReactionsDrawer } from "./conversation-message-reaction-drawer/conversation-message-reaction-drawer.service"
import { useConversationMessageReactionsRolledUp } from "./use-conversation-message-reactions-rolled-up"

const MAX_REACTION_EMOJIS_SHOWN = 3

export const ConversationMessageReactions = memo(function ConversationMessageReactions() {
  const { themed, theme } = useAppTheme()

  const { fromMe, xmtpMessageId: messageId } = useConversationMessageContextStoreContext(
    useSelect(["fromMe", "xmtpMessageId"]),
  )

  const rolledUpReactions = useConversationMessageReactionsRolledUp({
    xmtpMessageId: messageId,
  })

  const handlePressContainer = useCallback(() => {
    openMessageReactionsDrawer({
      messageId,
    })
  }, [messageId])

  if (rolledUpReactions.totalCount === 0) {
    return null
  }

  return (
    <AnimatedHStack
      // {...debugBorder()}
      entering={theme.animation.reanimatedFadeInScaleIn()}
      style={[
        {
          flexDirection: "row",
          flexWrap: "wrap",
        },
        fromMe && { justifyContent: "flex-end" },
      ]}
    >
      <TouchableHighlight
        onPress={handlePressContainer}
        underlayColor="transparent"
        accessibilityRole="button"
        accessibilityLabel="View reactions"
      >
        <VStack style={themed($reactionButton)}>
          <HStack style={themed($emojiContainer)}>
            {rolledUpReactions.preview
              .slice(0, MAX_REACTION_EMOJIS_SHOWN)
              .map((reaction, index) => (
                <Text key={index}>{reaction.content}</Text>
              ))}
          </HStack>
          {rolledUpReactions.totalCount > 1 && (
            <Text style={themed($reactorCount)}>{rolledUpReactions.totalCount}</Text>
          )}
        </VStack>
      </TouchableHighlight>
    </AnimatedHStack>
  )
})

const $reactionButton: ThemedStyle<ViewStyle> = ({
  colors,
  spacing,
  borderRadius,
  borderWidth,
}) => ({
  flexDirection: "row",
  alignItems: "center",
  // -borderWidth.sm because in Figma the padding includes the border
  paddingHorizontal: spacing.xs - borderWidth.sm,
  // -borderWidth.sm because in Figma the padding includes the border
  paddingVertical: spacing.xxs - borderWidth.sm,

  borderRadius: borderRadius.sm,
  borderWidth: borderWidth.sm,
  borderColor: colors.border.subtle,
})

const $emojiContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xxxs,
})

const $reactorCount: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  marginLeft: spacing.xxxs,
  color: colors.text.secondary,
})
