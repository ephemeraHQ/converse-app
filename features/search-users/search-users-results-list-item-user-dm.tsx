import { memo } from "react"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { useDmQuery } from "@/features/dm/dm.query"
import { SearchUsersResultsListItemUser } from "@/features/search-users/search-users-results-list-item-user"
import { IXmtpConversationId } from "@/features/xmtp/xmtp.types"

export const SearchUsersResultsListItemUserDm = memo(
  function SearchUsersResultsListItemUserDm(props: {
    xmtpConversationId: IXmtpConversationId
    onPress: () => void
  }) {
    const { xmtpConversationId, onPress } = props

    const currentSenderInboxId = useSafeCurrentSender().inboxId

    const { data: dm } = useDmQuery({
      clientInboxId: currentSenderInboxId,
      xmtpConversationId,
    })

    if (!dm) {
      return null
    }

    // For now logic of both User and DM is the same
    return <SearchUsersResultsListItemUser inboxId={dm.peerInboxId} onPress={onPress} />
  },
)
