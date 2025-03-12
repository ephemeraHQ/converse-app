import { IXmtpConversationTopic } from "@features/xmtp/xmtp.types"
import { memo } from "react"
import { GroupAvatar } from "@/components/group-avatar"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { useGroupName } from "@/features/groups/hooks/use-group-name"
import { useGroupMembersQuery } from "@/features/groups/useGroupMembersQuery"
import { usePreferredDisplayInfoBatch } from "@/features/preferred-display-info/use-preferred-display-info-batch"
import { SearchUsersResultListItem } from "@/features/search-users/search-users-result-list-item"

export const SearchUsersResultsListItemGroup = memo(
  function SearchUsersResultsListItemGroup(props: {
    conversationTopic: IXmtpConversationTopic
    onPress: () => void
  }) {
    const { conversationTopic, onPress } = props

    const currentSender = useSafeCurrentSender()

    const { data: members } = useGroupMembersQuery({
      caller: "SearchUsersResultsListItemGroup",
      clientInboxId: currentSender.inboxId,
      topic: conversationTopic,
    })

    const { groupName } = useGroupName({
      conversationTopic,
    })

    const preferredDisplayData = usePreferredDisplayInfoBatch({
      xmtpInboxIds: members?.ids?.slice(0, 3) ?? [],
    })

    return (
      <SearchUsersResultListItem
        avatar={<GroupAvatar groupTopic={conversationTopic} />}
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
