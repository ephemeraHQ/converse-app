import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query"
import {
  getSafeCurrentSender,
  useSafeCurrentSender,
} from "@/features/authentication/multi-inbox.store"
import { getAllowedConsentConversationsQueryData } from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import { isConversationDm } from "@/features/conversation/utils/is-conversation-dm"
import { ensureDmPeerInboxIdQueryData } from "@/features/dm/use-dm-peer-inbox-id-query"
import { ensureGroupMembersQueryData } from "@/features/groups/group-members.query"
import { ensureProfileQueryData } from "@/features/profiles/profiles.query"
import { doesSocialProfilesMatchTextQuery } from "@/features/profiles/utils/does-social-profiles-match-text-query"
import { ensureSocialProfilesForAddressQuery } from "@/features/social-profiles/social-profiles.query"
import { captureError } from "@/utils/capture-error"
import { normalizeString } from "@/utils/str"
import { IConversationTopic } from "../../conversation.types"

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
  const { searchQuery, inboxId } = args
  const currentSender = getSafeCurrentSender()
  const conversations = getAllowedConsentConversationsQueryData({
    inboxId: currentSender.inboxId,
  })
  const normalizedSearchQuery = searchQuery.toLowerCase().trim()

  if (!conversations) {
    return []
  }

  // Return early if search query is empty
  if (!normalizedSearchQuery) {
    return []
  }

  const matchingTopics: IConversationTopic[] = []
  const dmConversations = conversations.filter(isConversationDm)

  const results = await Promise.all(
    dmConversations.map(async (conversation) => {
      try {
        // Get peer's inbox ID from either group members or DM peer data, using whichever returns first
        const [peerInboxId, members] = await Promise.race([
          ensureGroupMembersQueryData({
            caller: "searchExistingDms",
            clientInboxId: currentSender.inboxId,
            topic: conversation.topic,
          }).then((members) => {
            const otherId = members.ids.find((id) => id !== inboxId)
            return [otherId, members] as const
          }),

          ensureDmPeerInboxIdQueryData({
            inboxId: currentSender.inboxId,
            topic: conversation.topic,
            caller: "searchExistingDms",
          }).then((peerId) => [peerId, null] as const),
        ])

        const otherMemberInboxId = peerInboxId || members?.ids.find((id) => id !== inboxId)

        if (!otherMemberInboxId) {
          throw new Error("No other member inbox Id found for conversation DM")
        }

        const profile = await ensureProfileQueryData({
          xmtpId: otherMemberInboxId,
        })

        const hasProfileMatch = profile?.name?.toLowerCase().includes(normalizedSearchQuery)

        const socialProfiles = await ensureSocialProfilesForAddressQuery({
          ethAddress: profile.privyAddress,
        })

        const hasSocialProfileMatch = doesSocialProfilesMatchTextQuery({
          socialProfiles,
          normalizedQuery: normalizedSearchQuery,
        })

        return hasProfileMatch || hasSocialProfileMatch ? conversation.topic : null
      } catch (e) {
        captureError(e)
        return null
      }
    }),
  )

  // Filter out nulls and add matching topics to results
  matchingTopics.push(...results.filter(Boolean))

  return matchingTopics
}

export function useSearchExistingDmsQuery(args: { searchQuery: string; inboxId: IXmtpInboxId }) {
  return useQuery(getSearchExistingDmsQueryOptions(args))
}
