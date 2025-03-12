import { InboxId } from "@xmtp/react-native-sdk"
import { memo, useCallback } from "react"
import { Chip, ChipText } from "@/design-system/chip"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { useGroupMembersQuery } from "@/features/groups/useGroupMembersQuery"
import { SearchUsersResultsListItemUser } from "@/features/search-users/search-users-results-list-item-user"
import { useRouteParams } from "@/navigation/use-navigation"
import { useAddGroupMembersStore } from "../stores/add-group-members.store"

export const AddGroupMembersSearchUsersResultsListItemUser = memo(
  function AddGroupMembersSearchUsersResultsListItemUser(props: { inboxId: InboxId }) {
    const { addSelectedInboxId } = useAddGroupMembersStore((state) => state.actions)
    const { groupTopic } = useRouteParams<"AddGroupMembers">()

    const { data: members } = useGroupMembersQuery({
      clientInboxId: getSafeCurrentSender().inboxId,
      topic: groupTopic!,
      caller: "add-group-members",
    })

    const handlePress = useCallback(() => {
      addSelectedInboxId(props.inboxId)
    }, [addSelectedInboxId, props.inboxId])

    const isAlreadyAMember = members?.byId[props.inboxId]

    return (
      <SearchUsersResultsListItemUser
        inboxId={props.inboxId}
        onPress={handlePress}
        {...(isAlreadyAMember
          ? {
              endElement: (
                <Chip size="sm">
                  <ChipText>Already in the group</ChipText>
                </Chip>
              ),
            }
          : {})}
      />
    )
  },
)
