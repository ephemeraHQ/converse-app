import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query"
import { InboxId } from "@xmtp/react-native-sdk"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { getAllowedConsentConversationsQueryData } from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group"
import { normalizeString } from "@/utils/str"

export async function searchExistingGroupsByGroupName(args: { searchQuery: string }) {
  const { searchQuery } = args
  const currentAccount = getSafeCurrentSender().ethereumAddress
  const conversations = getAllowedConsentConversationsQueryData({
    inboxId: currentAccount,
  })

  if (!conversations || !searchQuery) {
    return []
  }

  const groups = conversations.filter(isConversationGroup)

  return groups
    .filter((group) => normalizeString(group.groupName).includes(searchQuery))
    .map((group) => group.topic)
}

export function getSearchExistingGroupsByGroupNameQueryOptions(args: {
  searchQuery: string
  searcherInboxId: InboxId
}) {
  const { searchQuery, searcherInboxId } = args
  const normalizedSearchQuery = normalizeString(searchQuery)
  return queryOptions({
    queryKey: ["search-existing-groups-by-group-name", normalizedSearchQuery, searcherInboxId],
    queryFn: () => {
      return searchExistingGroupsByGroupName({
        searchQuery: normalizedSearchQuery,
      })
    },
    enabled: !!normalizedSearchQuery && !!searcherInboxId,
    staleTime: 0,
    // Keep showing previous search results while new results load
    // to prevent UI flicker during search
    placeholderData: keepPreviousData,
  })
}

export function useSearchExistingGroupsByGroupNameQuery(args: {
  searchQuery: string
  searcherInboxId: InboxId
}) {
  return useQuery(getSearchExistingGroupsByGroupNameQueryOptions(args))
}
