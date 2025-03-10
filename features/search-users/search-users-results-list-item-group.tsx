import { ConversationTopic } from "@xmtp/react-native-sdk"
import { memo } from "react"
import { GroupAvatar } from "@/components/group-avatar"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { useGroupName } from "@/features/groups/hooks/use-group-name"
import { useGroupMembersQuery } from "@/features/groups/useGroupMembersQuery"
import { usePreferredDisplayInfoBatch } from "@/features/preferred-display-info/use-preferred-display-info-batch"
import { SearchUsersResultListItem } from "@/features/search-users/search-users-result-list-item"

export const SearchUsersResultsListItemGroup = memo(
  function SearchUsersResultsListItemGroup(props: {
    conversationTopic: ConversationTopic
    onPress: () => void
  }) {
    const { conversationTopic, onPress } = props

    const { data: members } = useGroupMembersQuery({
      caller: "SearchUsersResultsListItemGroup",
      account: getSafeCurrentSender().ethereumAddress,
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
