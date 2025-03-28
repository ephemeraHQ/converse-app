import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { memo, useCallback, useMemo } from "react"
import { Pressable } from "@/design-system/Pressable"
import { useGroupMember } from "@/features/groups/hooks/use-group-member"
import { GroupDetailsListItem } from "@/features/groups/ui/group-details.ui"
import {
  getGroupMemberIsAdmin,
  getGroupMemberIsSuperAdmin,
} from "@/features/groups/utils/group-admin.utils"
import { usePreferredDisplayInfo } from "@/features/preferred-display-info/use-preferred-display-info"
import { useRouteParams } from "@/navigation/use-navigation"
import { openGroupMemberDetailsBottomSheet } from "./group-member-details/group-member-details.service"

export const MemberListItem = memo(function MemberListItem(props: { memberInboxId: IXmtpInboxId }) {
  const { memberInboxId } = props

  const { xmtpConversationId } = useRouteParams<"GroupDetails">()

  const { displayName, avatarUrl } = usePreferredDisplayInfo({
    inboxId: memberInboxId,
  })

  const handlePress = useCallback(() => {
    openGroupMemberDetailsBottomSheet(memberInboxId)
  }, [memberInboxId])

  const { groupMember } = useGroupMember({
    memberInboxId,
    xmtpConversationId,
  })

  const subtitle = useMemo(() => {
    if (!groupMember) {
      return undefined
    }

    // Get role and consent state labels
    const roleLabel = getGroupMemberIsSuperAdmin({ member: groupMember })
      ? "Super Admin"
      : getGroupMemberIsAdmin({ member: groupMember })
        ? "Admin"
        : undefined

    // Get consent state label if not allowed
    const consentLabel = (() => {
      // Don't show consent if they accepted
      if (groupMember.consentState === "allowed") {
        return undefined
      }
      switch (groupMember.consentState) {
        case "unknown":
          return "Invited"
        case "denied":
          return "Rejected"
        default:
          return undefined
      }
    })()

    // Combine role and consent state
    if (roleLabel && consentLabel) {
      return `${roleLabel} (${consentLabel})`
    }

    return roleLabel || consentLabel
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
