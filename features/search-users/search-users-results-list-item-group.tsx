import { memo } from "react"
import { GroupAvatar } from "@/components/group-avatar"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { useGroupMembers } from "@/features/groups/hooks/use-group-members"
import { useGroupName } from "@/features/groups/hooks/use-group-name"
import { usePreferredDisplayInfoBatch } from "@/features/preferred-display-info/use-preferred-display-info-batch"
import { SearchUsersResultListItem } from "@/features/search-users/search-users-result-list-item"
import { IXmtpConversationId } from "@/features/xmtp/xmtp.types"

export const SearchUsersResultsListItemGroup = memo(
  function SearchUsersResultsListItemGroup(props: {
    xmtpConversationId: IXmtpConversationId
    onPress: () => void
  }) {
    const { xmtpConversationId, onPress } = props

    const currentSender = useSafeCurrentSender()

    const { members } = useGroupMembers({
      caller: "SearchUsersResultsListItemGroup",
      clientInboxId: currentSender.inboxId,
      xmtpConversationId,
    })

    const { groupName } = useGroupName({
      xmtpConversationId,
    })

    const preferredDisplayData = usePreferredDisplayInfoBatch({
      xmtpInboxIds: members?.ids?.slice(0, 3) ?? [],
    })

    return (
      <SearchUsersResultListItem
        avatar={<GroupAvatar xmtpConversationId={xmtpConversationId} />}
        title={groupName}
        subtitle={
          preferredDisplayData
            ?.slice(0, 3)
            .map((profile) => profile?.displayName)
            .join(", ") ?? ""
        }
        onPress={onPress}
      />
    )
  },
)
