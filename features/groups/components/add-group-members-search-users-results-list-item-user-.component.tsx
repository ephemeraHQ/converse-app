import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { memo, useCallback } from "react"
import { Chip, ChipText } from "@/design-system/chip"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { useGroupMembers } from "@/features/groups/hooks/use-group-members"
import { useAddGroupMembersStore } from "@/features/groups/stores/add-group-members.store"
import { SearchUsersResultsListItemUser } from "@/features/search-users/search-users-results-list-item-user"
import { useRouteParams } from "@/navigation/use-navigation"

export const AddGroupMembersSearchUsersResultsListItemUser = memo(
  function AddGroupMembersSearchUsersResultsListItemUser(props: { inboxId: IXmtpInboxId }) {
    const { inboxId } = props

    const { addSelectedInboxId } = useAddGroupMembersStore((state) => state.actions)
    const { xmtpConversationId } = useRouteParams<"AddGroupMembers">()

    const { members } = useGroupMembers({
      clientInboxId: getSafeCurrentSender().inboxId,
      xmtpConversationId,
      caller: "add-group-members",
    })

    const handlePress = useCallback(() => {
      addSelectedInboxId(inboxId)
    }, [addSelectedInboxId, inboxId])

    const isAlreadyAMember = members?.byId[inboxId]

    return (
      <SearchUsersResultsListItemUser
        inboxId={inboxId}
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
