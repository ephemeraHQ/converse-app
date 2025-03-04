import { HStack } from "@design-system/HStack"
import { VStack } from "@design-system/VStack"
import React, { memo, useCallback } from "react"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { ReplyPreview } from "@/features/conversation/conversation-composer/conversation-composer-reply-preview"
import { useAppTheme } from "@/theme/use-app-theme"
import { captureErrorWithToast } from "@/utils/capture-error"
import { AddAttachmentButton } from "./conversation-composer-add-attachment-button"
import { ConversationComposerAttachmentPreview } from "./conversation-composer-attachment-preview"
import { SendButton } from "./conversation-composer-send-button"
import { ConversationComposerTextInput } from "./conversation-composer-text-input"
import { useSend } from "./conversation-composer-use-send"

export const ConversationComposer = memo(function ConversationComposer() {
  const { theme } = useAppTheme()
  const insets = useSafeAreaInsets()

  const { send } = useSend()

  const handleSend = useCallback(async () => {
    try {
      await send()
    } catch (error) {
      captureErrorWithToast(error, { message: "Failed to send message" })
    }
  }, [send])

  return (
    <VStack
      // {...debugBorder()}
      style={{
        paddingBottom: insets.bottom,
        justifyContent: "flex-end",
        overflow: "hidden",
        backgroundColor: theme.colors.background.surfaceless,
      }}
    >
      <ReplyPreview />
      <VStack
        style={{
          margin: 6, // 6 in the Figma
        }}
      >
        <HStack
          style={{
            alignItems: "flex-end",
          }}
        >
          <AddAttachmentButton />
          <VStack
            style={{
              flex: 1,
              margin: theme.spacing.xxxs - theme.borderWidth.sm, // -theme.borderWidth.sm because of the borderWidth is count in react-native and we want exact pixels
              borderWidth: theme.borderWidth.sm,
              borderColor: theme.colors.border.subtle,
              borderRadius:
                theme.borderRadius.md -
                // 6 is the margin between the send button and the composer border
                6 / 2,
              overflow: "hidden",
              justifyContent: "flex-end",
            }}
          >
            <ConversationComposerAttachmentPreview />
            <HStack
              style={{
                // ...debugBorder("blue"),
                alignItems: "center",
              }}
            >
              <ConversationComposerTextInput onSubmitEditing={handleSend} />
              <SendButton onPress={handleSend} />
            </HStack>
          </VStack>
        </HStack>
      </VStack>
    </VStack>
  )
})
