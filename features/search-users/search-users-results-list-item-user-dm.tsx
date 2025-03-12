import { IXmtpConversationTopic } from "@features/xmtp/xmtp.types"
import { memo } from "react"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { useDmPeerInboxIdQuery } from "@/features/dm/use-dm-peer-inbox-id-query"
import { SearchUsersResultsListItemUser } from "@/features/search-users/search-users-results-list-item-user"

export const SearchUsersResultsListItemUserDm = memo(
  function SearchUsersResultsListItemUserDm(props: {
    conversationTopic: IXmtpConversationTopic
    onPress: () => void
  }) {
    const { conversationTopic, onPress } = props

    const currentSenderInboxId = useSafeCurrentSender().inboxId

    const { data: inboxId } = useDmPeerInboxIdQuery({
      inboxId: currentSenderInboxId,
      topic: conversationTopic,
      caller: `DmSearchResult-${conversationTopic}`,
    })

    // For now logic of both User and DM is the same
    return <SearchUsersResultsListItemUser inboxId={inboxId!} onPress={onPress} />
  },
)
