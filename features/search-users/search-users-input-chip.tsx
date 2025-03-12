import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { memo, useCallback } from "react"
import { Chip, ChipAvatar, ChipText } from "@/design-system/chip"
import { usePreferredDisplayInfo } from "@/features/preferred-display-info/use-preferred-display-info"
import { useSearchUsersInputStore } from "@/features/search-users/search-users-input.store"
import { Haptics } from "@/utils/haptics"

export const SearchUsersInputChip = memo(function SearchUsersInputChip(props: {
  inboxId: IXmtpInboxId
}) {
  const { inboxId } = props

  const { displayName, avatarUrl } = usePreferredDisplayInfo({
    inboxId,
  })

  const selectedChipInboxId = useSearchUsersInputStore((state) => state.selectedChipInboxId)

  const handlePress = useCallback(() => {
    Haptics.softImpactAsync()
    useSearchUsersInputStore.getState().actions.setSelectedChipInboxId(inboxId)
  }, [inboxId])

  return (
    <Chip isSelected={selectedChipInboxId === inboxId} onPress={handlePress} size="md">
      <ChipAvatar uri={avatarUrl} name={displayName} />
      <ChipText>{displayName}</ChipText>
    </Chip>
  )
})
