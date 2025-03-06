import { InboxId } from "@xmtp/react-native-sdk"
import { memo, useCallback, useMemo } from "react"
import { Pressable } from "@/design-system/Pressable"
import { openMemberDetailsBottomSheet } from "@/features/groups/group-details/components/group-details-member-details.bottom-sheet"
import { GroupDetailsListItem } from "@/features/groups/group-details/components/group-details.ui"
import { useGroupMember } from "@/features/groups/hooks/use-group-member"
import {
  getGroupMemberIsAdmin,
  getGroupMemberIsSuperAdmin,
} from "@/features/groups/utils/group-admin.utils"
import { usePreferredDisplayInfo } from "@/features/preferred-display-info/use-preferred-display-info"
import { useRouteParams } from "@/navigation/use-navigation"

export const MemberListItem = memo(function MemberListItem(props: { memberInboxId: InboxId }) {
  const { memberInboxId } = props

  const { groupTopic } = useRouteParams<"GroupDetails">()

  const { displayName, avatarUrl } = usePreferredDisplayInfo({
    inboxId: memberInboxId,
  })

  const handlePress = useCallback(() => {
    openMemberDetailsBottomSheet(memberInboxId)
  }, [memberInboxId])

  const { groupMember } = useGroupMember({
    memberInboxId,
    topic: groupTopic,
  })

  const subtitle = useMemo(() => {
    if (!groupMember) {
      return undefined
    }

    if (getGroupMemberIsSuperAdmin({ member: groupMember })) {
      return "Super Admin"
    }

    if (getGroupMemberIsAdmin({ member: groupMember })) {
      return "Admin"
    }

    if (groupMember.consentState === "unknown") {
      return "Invited"
    }

    if (groupMember.consentState === "denied") {
      return "Rejected"
    }

    if (groupMember.consentState === "allowed") {
      return "Joined"
    }

    return undefined
  }, [groupMember])

  return (
    <Pressable onPress={handlePress}>
      <GroupDetailsListItem
        avatar={avatarUrl}
        avatarName={displayName}
        title={displayName}
        subtitle={subtitle}
      />
    </Pressable>
  )
})
