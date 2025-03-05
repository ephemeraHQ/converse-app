import { InboxId } from "@xmtp/react-native-sdk"
import { memo, useCallback } from "react"
import { Pressable } from "@/design-system/Pressable"
import { GroupDetailsListItem } from "@/features/group-details/components/group-details.ui"
import { usePreferredDisplayInfo } from "@/features/preferred-display-info/use-preferred-display-info"
import { useRouter } from "@/navigation/use-navigation"

export const MemberListItem = memo(function MemberListItem(props: {
  memberInboxId: InboxId
  isAdmin: boolean
  isSuperAdmin: boolean
}) {
  const { memberInboxId, isAdmin, isSuperAdmin } = props
  const router = useRouter()

  const { displayName, avatarUrl } = usePreferredDisplayInfo({
    inboxId: memberInboxId,
  })

  const handlePress = useCallback(() => {
    router.push("Profile", { inboxId: memberInboxId })
  }, [memberInboxId, router])

  return (
    <Pressable onPress={handlePress}>
      <GroupDetailsListItem
        avatar={avatarUrl}
        avatarName={displayName}
        title={displayName}
        subtitle={isAdmin || isSuperAdmin ? "Admin" : undefined}
      />
    </Pressable>
  )
})
