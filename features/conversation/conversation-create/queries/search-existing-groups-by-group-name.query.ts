import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { getAllowedConsentConversationsQueryData } from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import { getConversationsFromIds } from "@/features/conversation/utils/get-conversations"
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group"
import { normalizeString } from "@/utils/str"

export async function searchExistingGroupsByGroupName(args: { searchQuery: string }) {
  const { searchQuery } = args
  const currentSender = getSafeCurrentSender()

  const conversationsIds = getAllowedConsentConversationsQueryData({
    clientInboxId: currentSender.inboxId,
  })

  const conversations = getConversationsFromIds({
    clientInboxId: currentSender.inboxId,
    conversationIds: conversationsIds ?? [],
  })

  const groups = conversations.filter(isConversationGroup)

  return groups
    .filter((group) => normalizeString(group.name).includes(searchQuery))
    .map((group) => group.xmtpId)
}

export function getSearchExistingGroupsByGroupNameQueryOptions(args: {
  searchQuery: string
  searcherInboxId: IXmtpInboxId
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
  searcherInboxId: IXmtpInboxId
}) {
  return useQuery(getSearchExistingGroupsByGroupNameQueryOptions(args))
}
