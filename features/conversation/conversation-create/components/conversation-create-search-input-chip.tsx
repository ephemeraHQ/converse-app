import { InboxId } from "@xmtp/react-native-sdk"
import React, { memo, useCallback } from "react"
import { Chip, ChipAvatar, ChipText } from "@/design-system/chip"
import { usePreferredDisplayInfo } from "@/features/preferred-display-info/use-preferred-display-info"
import { Haptics } from "@/utils/haptics"
import { useConversationCreateSearchInputStore } from "./conversation-create-search-input.store"

export const ConversationCreateSearchInputChip = memo(
  function ConversationCreateSearchInputChip(props: { inboxId: InboxId }) {
    const { inboxId } = props

    const { displayName, avatarUrl } = usePreferredDisplayInfo({
      inboxId,
    })

    const selectedChipInboxId = useConversationCreateSearchInputStore(
      (state) => state.selectedChipInboxId,
    )

    const handlePress = useCallback(() => {
      Haptics.softImpactAsync()
      useConversationCreateSearchInputStore.getState().actions.setSelectedChipInboxId(inboxId)
    }, [inboxId])

    return (
      <Chip isSelected={selectedChipInboxId === inboxId} onPress={handlePress} size="md">
        <ChipAvatar uri={avatarUrl} name={displayName} />
        <ChipText>{displayName}</ChipText>
      </Chip>
    )
  },
)
