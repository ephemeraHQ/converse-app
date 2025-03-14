import { memo } from "react"
import { GroupAvatar } from "@/components/group-avatar"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { useGroupMembersQuery } from "@/features/groups/group-members.query"
import { useGroupName } from "@/features/groups/hooks/use-group-name"
import { usePreferredDisplayInfoBatch } from "@/features/preferred-display-info/use-preferred-display-info-batch"
import { SearchUsersResultListItem } from "@/features/search-users/search-users-result-list-item"
import { IConversationTopic } from "../conversation/conversation.types"

export const SearchUsersResultsListItemGroup = memo(
  function SearchUsersResultsListItemGroup(props: {
    conversationTopic: IConversationTopic
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
