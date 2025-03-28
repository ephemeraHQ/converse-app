import { BottomSheet } from "@design-system/BottomSheet/BottomSheet"
import { BottomSheetContentContainer } from "@design-system/BottomSheet/BottomSheetContentContainer"
import { BottomSheetHeader } from "@design-system/BottomSheet/BottomSheetHeader"
import { HStack } from "@design-system/HStack"
import { Text } from "@design-system/Text"
import { TouchableHighlight } from "@design-system/touchable-highlight"
import { BottomSheetScrollView } from "@gorhom/bottom-sheet"
import { FlashList } from "@shopify/flash-list"
import { memo, useCallback, useState } from "react"
import { Modal, Platform, TextStyle, ViewStyle } from "react-native"
import { ScrollView } from "react-native-gesture-handler"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Avatar } from "@/components/avatar"
import { useMessageReactionsStore } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-reactions/conversation-message-reaction-drawer/conversation-message-reaction-drawer.store"
import { useConversationMessageReactionsRolledUp } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-reactions/use-conversation-message-reactions-rolled-up"
import { useCurrentXmtpConversationIdSafe } from "@/features/conversation/conversation-chat/conversation.store-context"
import { useRemoveReactionOnMessage } from "@/features/conversation/conversation-chat/use-remove-reaction-on-message.mutation"
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme"
import { captureErrorWithToast } from "@/utils/capture-error"
import { GenericError } from "@/utils/error"
import {
  closeMessageReactionsDrawer,
  conversationMessageDrawerBottomSheetRef,
} from "./conversation-message-reaction-drawer.service"

export const MessageReactionsDrawer = memo(function MessageReactionsDrawer() {
  const insets = useSafeAreaInsets()

  const messageId = useMessageReactionsStore((state) => state.messageId)

  // Centralized dismiss handler that:
  // 1. Closes the bottom sheet UI component
  // 2. Resets the global drawer state
  // This ensures consistent cleanup and prevents UI state mismatches
  const handleDismiss = useCallback(() => {
    closeMessageReactionsDrawer()
  }, [])

  const isVisible = !!messageId

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={Platform.OS === "android"}
    >
      <BottomSheet
        ref={conversationMessageDrawerBottomSheetRef}
        snapPoints={["65%", "90%"]}
        index={0}
        enablePanDownToClose
        enableOverDrag={false}
        enableDynamicSizing={false}
        onChange={(index) => {
          if (index === -1) {
            handleDismiss()
          }
        }}
        topInset={insets.top}
      >
        <BottomSheetContent />
      </BottomSheet>
    </Modal>
  )
})

const BottomSheetContent = memo(function BottomSheetContent() {
  const { theme, themed } = useAppTheme()

  const xmtpConversationId = useCurrentXmtpConversationIdSafe()
  const messageId = useMessageReactionsStore((state) => state.messageId)! // Using ! because we know when using this function we MUST have messageId;

  const rolledUpReactions = useConversationMessageReactionsRolledUp({
    xmtpMessageId: messageId,
  })

  const [filterReactions, setFilterReactions] = useState<string | null>(null)

  const { removeReactionOnMessage: removeReactionFromMessage } = useRemoveReactionOnMessage({
    xmtpConversationId,
  })

  const handleRemoveReaction = useCallback(
    async ({ content }: { content: string }) => {
      try {
        await removeReactionFromMessage({
          messageId,
          emoji: content,
        })
        closeMessageReactionsDrawer()
      } catch (error) {
        captureErrorWithToast(
          new GenericError({ error, additionalMessage: "Failed to remove reaction" }),
        )
      }
    },
    [messageId, removeReactionFromMessage],
  )

  return (
    <>
      <BottomSheetContentContainer>
        <BottomSheetHeader title="Reactions" hasClose />

        {/* Preview of all reactions with counts and filter buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{
            paddingLeft: theme.spacing.lg,
            flexDirection: "row",
          }}
          scrollEnabled
        >
          {/* "All" button to clear the filter */}
          <TouchableHighlight
            onPress={() => setFilterReactions(null)}
            style={[themed($chip), filterReactions === null && themed($chipActive)]}
          >
            <HStack style={{ alignItems: "center" }}>
              <Text style={themed(filterReactions === null ? $chipTextActive : $chipText)}>
                All {rolledUpReactions.totalCount}
              </Text>
            </HStack>
          </TouchableHighlight>

          {/* Buttons for each unique reaction type with counts */}
          {rolledUpReactions.preview.map((reaction, index) => (
            <TouchableHighlight
              key={index}
              onPress={() =>
                setFilterReactions(reaction.content === filterReactions ? null : reaction.content)
              }
              style={[themed($chip), filterReactions === reaction.content && themed($chipActive)]}
            >
              <Text
                style={themed(filterReactions === reaction.content ? $chipTextActive : $chipText)}
              >
                {reaction.content} {reaction.count}
              </Text>
            </TouchableHighlight>
          ))}
          <HStack style={{ width: theme.spacing.xxl }} />
        </ScrollView>
      </BottomSheetContentContainer>

      {/* Detailed list of each reaction, sorted and filtered with all own reactions on top */}
      <BottomSheetScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <FlashList
          estimatedItemSize={rolledUpReactions.totalCount}
          data={rolledUpReactions.detailed.filter(
            (item) => !filterReactions || item.content === filterReactions,
          )}
          renderItem={({ item, index }) => {
            const isOwnReaction = item.isOwnReaction
            const ReactionContainer = isOwnReaction ? TouchableHighlight : HStack
            const containerProps = isOwnReaction
              ? {
                  onPress: () =>
                    handleRemoveReaction({
                      content: item.content,
                    }),
                  underlayColor: "transparent",
                  activeOpacity: 0.75,
                }
              : {}

            return (
              <ReactionContainer {...containerProps} style={themed($reaction)}>
                <HStack style={themed($reactionInner)}>
                  <Avatar
                    sizeNumber={theme.avatarSize.md}
                    uri={item.reactor.avatar}
                    name={item.reactor.username}
                  />
                  <Text style={themed($username)}>{item.reactor.username}</Text>
                  <Text style={themed($reactionContent)}>{item.content}</Text>
                </HStack>
              </ReactionContainer>
            )
          }}
          keyExtractor={(item, index) => `${item.content}-${item.reactor.address}-${index}`}
        />
      </BottomSheetScrollView>
    </>
  )
})

const $chip: ThemedStyle<ViewStyle> = ({ spacing, borderRadius, borderWidth, colors }) => ({
  marginRight: spacing.xxs,
  marginBottom: spacing.xs,
  paddingVertical: spacing.xxs,
  paddingHorizontal: spacing.xs,
  borderRadius: borderRadius.sm,
  borderWidth: borderWidth.sm,
  borderColor: colors.border.subtle,
})

const $chipActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.border.subtle,
})

const $reaction: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  display: "flex",
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.lg,
})

const $reactionInner: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  gap: spacing.xs,
  flex: 1,
})

const $username: ThemedStyle<TextStyle> = ({ spacing, colors }) => ({
  flex: 1,
  display: "flex",
  alignItems: "flex-end",
  gap: spacing.xxxs,
  overflow: "hidden",
  color: colors.text.primary,
})

const $reactionContent: ThemedStyle<TextStyle> = ({ spacing }) => ({
  padding: spacing.xxxs,
})

const $chipText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text.secondary,
})

const $chipTextActive: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text.primary,
})
