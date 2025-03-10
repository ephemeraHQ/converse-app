import { AnimatedVStack } from "@design-system/VStack"
import { memo, useEffect, useRef } from "react"
import { Keyboard, TextInput } from "react-native"
import { useAnimatedStyle } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useConversationMessageContextMenuEmojiPickerStore } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-context-menu/conversation-message-context-menu-emoji-picker/conversation-message-context-menu-emoji-picker.store"
import { useConversationMessageContextMenuStoreContext } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-context-menu/conversation-message-context-menu.store-context"
import { useAnimatedKeyboard } from "@/hooks/use-animated-keyboard"
import { useKeyboardIsShown } from "@/hooks/use-keyboard-is-shown"

type IConversationKeyboardFillerProps = {}

export const ConversationKeyboardFiller = memo(function ConversationKeyboardFiller(
  props: IConversationKeyboardFillerProps,
) {
  const { keyboardHeightAV, progressAV, previousOpenKeyboardHeightAV } = useAnimatedKeyboard()
  const insets = useSafeAreaInsets()
  const wasKeyboardOpenRef = useRef(false)
  const textInputRef = useRef<TextInput>(null)
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

    if (messageContextMenuData) {
      // Store keyboard state when emoji picker opens
      if (isKeyboardShown) {
        Keyboard.dismiss()
        wasKeyboardOpenRef.current = true
      }
    }
    // Context menu is hidden
    else {
      // Restore keyboard state when emoji picker closes
      if (wasKeyboardOpenRef.current) {
        textInputRef.current?.focus()
        wasKeyboardOpenRef.current = false
      }
    }
  }, [isEmojiPickerOpen, messageContextMenuData, isKeyboardShown])

  const fillerAnimatedStyle = useAnimatedStyle(() => {
    if (messageContextMenuData) {
      return {
        height: previousOpenKeyboardHeightAV.value - insets.bottom,
      }
    }

    const baseHeight = typeof keyboardHeightAV.value === "number" ? keyboardHeightAV.value : 0
    const currentHeight = baseHeight * progressAV.value

    return {
      height: Math.max(currentHeight - insets.bottom, 0),
    }
  })

  return (
    <>
      <AnimatedVStack style={fillerAnimatedStyle} />
      {/* Hidden TextInput for keyboard focus management */}
      <TextInput
        ref={textInputRef}
        style={{ height: 0, width: 0, opacity: 0, position: "absolute" }}
      />
    </>
  )
})
