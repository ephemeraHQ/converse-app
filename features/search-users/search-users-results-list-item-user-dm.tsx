import { ConversationTopic } from "@xmtp/react-native-sdk"
import { memo } from "react"
import { useCurrentSenderEthAddress } from "@/features/authentication/multi-inbox.store"
import { SearchUsersResultsListItemUser } from "@/features/search-users/search-users-results-list-item-user"
import { useDmPeerInboxIdQuery } from "@/queries/use-dm-peer-inbox-id-query"

export const SearchUsersResultsListItemUserDm = memo(
  function SearchUsersResultsListItemUserDm(props: {
    conversationTopic: ConversationTopic
    onPress: () => void
  }) {
    const { conversationTopic, onPress } = props

    const currentAccount = useCurrentSenderEthAddress()!

    const { data: inboxId } = useDmPeerInboxIdQuery({
      account: currentAccount,
      topic: conversationTopic,
      caller: `DmSearchResult-${conversationTopic}`,
    })

    // For now logic of both User and DM is the same
    return <SearchUsersResultsListItemUser inboxId={inboxId!} onPress={onPress} />
  },
)
