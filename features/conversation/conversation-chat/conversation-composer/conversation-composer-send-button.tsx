import { IconButton } from "@design-system/IconButton/IconButton"
import { VStack } from "@design-system/VStack"
import React, { memo } from "react"
import { useAppTheme } from "@/theme/use-app-theme"
import { useConversationComposerStoreContext } from "./conversation-composer.store-context"

export const SendButton = memo(function SendButton(props: { onPress: () => void }) {
  const { onPress } = props

  const { theme } = useAppTheme()

  const mediaPreviews = useConversationComposerStoreContext((state) => state.composerMediaPreviews)
  const composerInputValue = useConversationComposerStoreContext((state) => state.inputValue)

  const canSend =
    composerInputValue.length > 0 || mediaPreviews.some((preview) => preview?.status === "uploaded")

  const margin = (36 - theme.spacing.lg) / 2 - theme.borderWidth.sm

  return (
    <VStack
      style={{
        marginHorizontal: margin,
        marginVertical: margin,
        alignSelf: "flex-end",
      }}
    >
      <IconButton
        preventDoubleTap
        hitSlop={theme.spacing.xs}
        size="sm"
        onPress={onPress}
        disabled={!canSend}
        iconName="arrow.up"
        iconWeight="medium"
      />
    </VStack>
  )
})
