import { IXmtpConversationId, IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { getAllowedConsentConversationsQueryData } from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import { getConversationsFromIds } from "@/features/conversation/utils/get-conversations"
import { isConversationDm } from "@/features/conversation/utils/is-conversation-dm"
import { ensureProfileQueryData } from "@/features/profiles/profiles.query"
import { doesSocialProfilesMatchTextQuery } from "@/features/profiles/utils/does-social-profiles-match-text-query"
import { ensureSocialProfilesForAddressQuery } from "@/features/social-profiles/social-profiles.query"
import { captureError } from "@/utils/capture-error"
import { GenericError } from "@/utils/error"
import { normalizeString } from "@/utils/str"

export function getSearchExistingDmsQueryOptions(args: {
  searchQuery: string
  inboxId: IXmtpInboxId
}) {
  const { searchQuery, inboxId } = args
  const normalizedSearchQuery = normalizeString(searchQuery)
  return queryOptions({
    queryKey: ["conversations-search", "dms", normalizedSearchQuery, inboxId],
    queryFn: () =>
      searchExistingDms({
        searchQuery: normalizedSearchQuery,
        inboxId,
      }),
    enabled: !!inboxId && !!normalizedSearchQuery,
    staleTime: 0,
    // Keep showing previous search results while new results load
    // to prevent UI flicker during search
    placeholderData: keepPreviousData,
  })
}

async function searchExistingDms(args: { searchQuery: string; inboxId: IXmtpInboxId }) {
  const { searchQuery } = args
  const currentSender = getSafeCurrentSender()
  const conversationIds = getAllowedConsentConversationsQueryData({
    clientInboxId: currentSender.inboxId,
  })
  const normalizedSearchQuery = searchQuery.toLowerCase().trim()

  const conversations = getConversationsFromIds({
    clientInboxId: currentSender.inboxId,
    conversationIds: conversationIds ?? [],
  })

  const matchingXmtpConversationIds: IXmtpConversationId[] = []
  const dmConversations = conversations.filter(isConversationDm)

  const results = await Promise.all(
    dmConversations.map(async (dm) => {
      try {
        const profile = await ensureProfileQueryData({
          xmtpId: dm.peerInboxId,
          caller: "SearchExistingDms",
        })

        const hasProfileMatch = profile?.name?.toLowerCase().includes(normalizedSearchQuery)

        const socialProfiles = await ensureSocialProfilesForAddressQuery({
          ethAddress: profile.privyAddress,
        })

        const hasSocialProfileMatch = doesSocialProfilesMatchTextQuery({
          socialProfiles,
          normalizedQuery: normalizedSearchQuery,
        })

        return hasProfileMatch || hasSocialProfileMatch ? dm.xmtpId : null
      } catch (error) {
        captureError(new GenericError({ error, additionalMessage: "Error searching existing dms" }))
        return null
      }
    }),
  )

  // Filter out nulls and add matching topics to results
  matchingXmtpConversationIds.push(...results.filter(Boolean))

  return matchingXmtpConversationIds
}

export function useSearchExistingDmsQuery(args: { searchQuery: string; inboxId: IXmtpInboxId }) {
  return useQuery(getSearchExistingDmsQueryOptions(args))
}
