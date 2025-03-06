import { AnimatedVStack } from "@design-system/VStack"
import { memo, useEffect, useRef } from "react"
import { Keyboard, TextInput } from "react-native"
import { useAnimatedStyle, useSharedValue } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useConversationMessageContextMenuEmojiPickerStore } from "@/features/conversation/conversation-chat/conversation-chat-message/conversation-message-context-menu/conversation-message-context-menu-emoji-picker/conversation-message-context-menu-emoji-picker.store"
import { useConversationMessageContextMenuStoreContext } from "@/features/conversation/conversation-chat/conversation-chat-message/conversation-message-context-menu/conversation-message-context-menu.store-context"
import { useAnimatedKeyboard } from "@/hooks/use-animated-keyboard"
import { useKeyboardIsShown } from "@/hooks/use-keyboard-is-shown"

type IConversationKeyboardFillerProps = {}

export const ConversationKeyboardFiller = memo(function ConversationKeyboardFiller(
  props: IConversationKeyboardFillerProps,
) {
  const { height: keyboardHeightAV } = useAnimatedKeyboard()
  const insets = useSafeAreaInsets()
  const lastKeyboardHeight = useSharedValue(0)
  const textInputRef = useRef<TextInput>(null)
  const keyboardWasOpenRef = useRef(false)
  const isKeyboardShown = useKeyboardIsShown()

  const messageContextMenuData = useConversationMessageContextMenuStoreContext(
    (state) => state.messageContextMenuData,
  )

  const isEmojiPickerOpen = useConversationMessageContextMenuEmojiPickerStore(
    (state) => state.isEmojiPickerOpen,
  )

  useEffect(() => {
    if (!isEmojiPickerOpen) {
      return
    }

    if (!!messageContextMenuData) {
      // If the keyboard is open, keep track of where it was because we need to open it again when the context menu is dismissed
      if (isKeyboardShown) {
        Keyboard.dismiss()
        lastKeyboardHeight.value = keyboardHeightAV.value
        keyboardWasOpenRef.current = true
      }
    }
    // Context menu is hidden
    else {
      // Reopen keyboard if it was open before context menu was shown
      if (keyboardWasOpenRef.current) {
        textInputRef.current?.focus()
        keyboardWasOpenRef.current = false
      }
    }
  }, [
    isEmojiPickerOpen,
    messageContextMenuData,
    isKeyboardShown,
    keyboardHeightAV,
    lastKeyboardHeight,
  ])

  // Reset the last height when context menu is dismissed
  // And make sure to wait until the keyboard is open to that the height animates back to what it was before
  useEffect(() => {
    if (!messageContextMenuData && isKeyboardShown) {
      lastKeyboardHeight.value = 0
    }
  }, [messageContextMenuData, isKeyboardShown, keyboardHeightAV, lastKeyboardHeight])

  const fillerAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: Math.max(
        Math.max(lastKeyboardHeight.value, keyboardHeightAV.value) - insets.bottom,
        0,
      ),
    }
  })

  return (
    <>
      <AnimatedVStack style={fillerAnimatedStyle} />
      {/* Need for focus on keyboard */}
      <TextInput
        ref={textInputRef}
        style={{ height: 0, width: 0, opacity: 0, position: "absolute" }}
      />
    </>
  )
})
