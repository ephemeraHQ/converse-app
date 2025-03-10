import { BottomSheetContentContainer } from "@design-system/BottomSheet/BottomSheetContentContainer"
import { BottomSheetHeader } from "@design-system/BottomSheet/BottomSheetHeader"
import { BottomSheetModal } from "@design-system/BottomSheet/BottomSheetModal"
import { Text } from "@design-system/Text"
import { TextField } from "@design-system/TextField/TextField"
import { VStack } from "@design-system/VStack"
import { translate } from "@i18n"
import { ICategorizedEmojisRecord, IEmoji } from "@utils/emojis/emoji-types"
import { emojis } from "@utils/emojis/emojis"
import { memo, useCallback, useRef, useState } from "react"
import { TextInput, TextStyle, ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { EmojiRowList } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-context-menu/conversation-message-context-menu-emoji-picker/conversation-message-context-menu-emoji-picker-list"
import { messageContextMenuEmojiPickerBottomSheetRef } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-context-menu/conversation-message-context-menu-emoji-picker/conversation-message-context-menu-emoji-picker-utils"
import { useConversationMessageContextMenuEmojiPickerStore } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-context-menu/conversation-message-context-menu-emoji-picker/conversation-message-context-menu-emoji-picker.store"
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme"
import { emojiTrie } from "@/utils/emojis/emoji-trie"

const flatEmojis = emojis.flatMap((category) => category.data)

const categorizedEmojis: ICategorizedEmojisRecord[] = []
emojis.forEach((category, index) => {
  for (let i = 0; i < category.data.length; i += 6) {
    const slicedEmojis = category.data.slice(i, i + 6).map((emoji) => emoji)
    categorizedEmojis.push({
      id: category.title + index,
      category: category.title,
      emojis: slicedEmojis,
    })
  }
})

const sliceEmojis = (emojis: IEmoji[]) => {
  const slicedEmojis: ICategorizedEmojisRecord[] = []
  for (let i = 0; i < emojis.length; i += 6) {
    const sliced = emojis.slice(i, i + 6).map((emoji) => emoji)
    slicedEmojis.push({
      id: emojis[i].emoji,
      category: emojis[i].emoji,
      emojis: sliced,
    })
  }
  return slicedEmojis
}

const defaultEmojis = sliceEmojis(flatEmojis)

export const MessageContextMenuEmojiPicker = memo(function MessageContextMenuEmojiPicker({
  onSelectReaction,
}: {
  onSelectReaction: (emoji: string) => void
}) {
  const textInputRef = useRef<TextInput>(null)

  const insets = useSafeAreaInsets()
  const { themed } = useAppTheme()

  const [filteredReactions, setFilteredReactions] = useState(defaultEmojis)
  const [hasInput, setHasInput] = useState(false)

  const closeMenu = useCallback(() => {
    textInputRef.current?.blur()
  }, [])

  const handleReaction = useCallback(
    (emoji: string) => {
      onSelectReaction(emoji)
      closeMenu()
    },
    [onSelectReaction, closeMenu],
  )

  const onTextInputChange = useCallback((value: string) => {
    if (value.trim() === "") {
      // Reset immediately when input is cleared
      setFilteredReactions(defaultEmojis)
      setHasInput(false)
    } else {
      const emojiSet = new Set()
      const emojis = emojiTrie.findAllWithPrefix(value)
      const dedupedEmojis = emojis.filter((emoji) => {
        if (emojiSet.has(emoji.emoji)) {
          return false
        }
        emojiSet.add(emoji.emoji)
        return true
      })
      const sliced = sliceEmojis(dedupedEmojis)
      setFilteredReactions(sliced)
      setHasInput(true)
    }
  }, [])

  const handleChange = useCallback((index: number) => {
    useConversationMessageContextMenuEmojiPickerStore.getState().setIsEmojiPickerOpen(index >= 0)
  }, [])

  const handleSearchTextFieldFocus = useCallback(() => {
    messageContextMenuEmojiPickerBottomSheetRef.current?.expand()
  }, [])

  return (
    <BottomSheetModal
      onClose={closeMenu}
      onChange={handleChange}
      ref={messageContextMenuEmojiPickerBottomSheetRef}
      topInset={insets.top}
      snapPoints={["50%", "100%"]}
    >
      <BottomSheetContentContainer>
        <BottomSheetHeader title={translate("choose_a_reaction")} hasClose />
        <TextField
          ref={textInputRef}
          onChangeText={onTextInputChange}
          placeholder={translate("search_emojis")}
          clearButtonMode="always"
          containerStyle={themed($inputContainer)}
          onFocus={handleSearchTextFieldFocus}
        />
      </BottomSheetContentContainer>

      <VStack style={themed($container)}>
        {hasInput ? (
          <EmojiRowList emojis={filteredReactions} onPress={handleReaction} />
        ) : (
          <EmojiRowList
            emojis={categorizedEmojis}
            onPress={handleReaction}
            ListHeader={
              <Text preset="smaller" style={themed($headerText)}>
                {translate("emoji_picker_all")}
              </Text>
            }
          />
        )}
      </VStack>
    </BottomSheetModal>
  )
})

const $inputContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginVertical: spacing.xxs,
  marginHorizontal: spacing.xxs,
})

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginHorizontal: spacing.xxs,
})

const $headerText: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginLeft: spacing.sm,
})
