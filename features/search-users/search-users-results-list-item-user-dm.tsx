import { memo } from "react"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { useDmPeerInboxIdQuery } from "@/features/dm/dm-peer-inbox-id.query"
import { SearchUsersResultsListItemUser } from "@/features/search-users/search-users-results-list-item-user"
import { IXmtpConversationId } from "@/features/xmtp/xmtp.types"

export const SearchUsersResultsListItemUserDm = memo(
  function SearchUsersResultsListItemUserDm(props: {
    xmtpConversationId: IXmtpConversationId
    onPress: () => void
  }) {
    const { xmtpConversationId, onPress } = props

    const currentSenderInboxId = useSafeCurrentSender().inboxId

    const { data: inboxId } = useDmPeerInboxIdQuery({
      inboxId: currentSenderInboxId,
      xmtpConversationId,
      caller: `DmSearchResult-${xmtpConversationId}`,
    })

    // For now logic of both User and DM is the same
    return <SearchUsersResultsListItemUser inboxId={inboxId!} onPress={onPress} />
  },
)
