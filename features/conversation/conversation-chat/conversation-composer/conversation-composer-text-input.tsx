import { textSizeStyles } from "@design-system/Text/Text.styles"
import React, { memo, useCallback, useEffect, useRef } from "react"
import {
  NativeSyntheticEvent,
  Platform,
  TextInput as RNTextInput,
  TextInputKeyPressEventData,
} from "react-native"
import { TextInput } from "@/design-system/text-input"
import { useConversationComposerIsEnabled } from "@/features/conversation/conversation-chat/conversation-composer/hooks/conversation-composer-is-enabled"
import { useAppTheme } from "@/theme/use-app-theme"
import { useConversationComposerStore } from "./conversation-composer.store-context"

export const ConversationComposerTextInput = memo(function ConversationComposerTextInput(props: {
  onSubmitEditing: () => Promise<void>
}) {
  const { onSubmitEditing } = props

  const inputRef = useRef<RNTextInput>(null)

  const { theme } = useAppTheme()

  const store = useConversationComposerStore()
  const isEnabled = useConversationComposerIsEnabled()
  const inputDefaultValue = store.getState().inputValue

  const handleChangeText = useCallback(
    (text: string) => {
      store.setState((state) => ({
        ...state,
        inputValue: text,
      }))
    },
    [store],
  )

  // If we clear the input (i.e after sending a message)
  // we need to clear the input value in the text input
  // Doing this since we are using a uncontrolled component
  useEffect(() => {
    const unsubscribe = store.subscribe((state, prevState) => {
      if (prevState.inputValue && !state.inputValue) {
        inputRef.current?.clear()
      }
    })

    return () => unsubscribe()
  }, [store])

  const handleSubmitEditing = useCallback(() => {
    onSubmitEditing()
  }, [onSubmitEditing])

  return (
    <TextInput
      style={{
        ...textSizeStyles.sm,
        color: theme.colors.text.primary,
        flex: 1,
        paddingHorizontal: theme.spacing.xs,
        paddingVertical:
          theme.spacing.xxs -
          // Because we input container to be exactly 36 pixels and borderWidth add with total height in react-native
          theme.borderWidth.sm,
      }}
      onKeyPress={(event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
        // Only handle Enter key on macOS
        if (Platform.OS === "macos") {
          const hasModifier =
            // @ts-ignore - macOS keyboard events have modifier properties
            event.nativeEvent.shiftKey || event.nativeEvent.altKey || event.nativeEvent.metaKey

          if (!hasModifier) {
            event.preventDefault()
            onSubmitEditing()
          }
        }
      }}
      editable={isEnabled}
      ref={inputRef}
      onSubmitEditing={handleSubmitEditing}
      onChangeText={handleChangeText}
      multiline
      defaultValue={inputDefaultValue}
      placeholder="Message"
      autoCorrect={false}
      placeholderTextColor={theme.colors.text.tertiary}
    />
  )
})
