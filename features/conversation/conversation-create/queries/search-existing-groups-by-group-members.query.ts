import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query"
import { ConversationTopic, InboxId } from "@xmtp/react-native-sdk"
import { matchSorter } from "match-sorter"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { getAllowedConsentConversationsQueryData } from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group"
import { ensureGroupMembersQueryData } from "@/features/groups/useGroupMembersQuery"
import { ensureProfileQueryData } from "@/features/profiles/profiles.query"
import { doesSocialProfilesMatchTextQuery } from "@/features/profiles/utils/does-social-profiles-match-text-query"
import { ensureSocialProfilesForAddressQuery } from "@/features/social-profiles/social-profiles.query"
import { captureError } from "@/utils/capture-error"
import { normalizeString } from "@/utils/str"

export async function searchExistingGroupsByGroupMembers(args: {
  searchQuery: string
  searcherInboxId: InboxId
}) {
  const { searchQuery, searcherInboxId } = args

  const currentAccount = getSafeCurrentSender().ethereumAddress

  const conversations = getAllowedConsentConversationsQueryData({
    account: currentAccount,
  })

  if (!conversations || !searchQuery) {
    return []
  }

  const matchingTopics: ConversationTopic[] = []

  await Promise.all(
    conversations.filter(isConversationGroup).map(async (group) => {
      try {
        const members = await ensureGroupMembersQueryData({
          caller: "searchExistingGroupsByGroupMembers",
          account: currentAccount,
          topic: group.topic,
        })

        const otherMembersInboxIds = members.ids.filter((id) => id !== searcherInboxId)

        // Use Promise.race to get the first matching member
        const result = await Promise.race([
          ...otherMembersInboxIds.map(async (inboxId) => {
            const profile = await ensureProfileQueryData({
              xmtpId: inboxId,
            })

            if (matchSorter([profile.name, profile.username], searchQuery).length > 0) {
              return true
            }

            const socialProfiles = await ensureSocialProfilesForAddressQuery({
              ethAddress: profile.privyAddress,
            })

            if (!socialProfiles) {
              return false
            }

            return doesSocialProfilesMatchTextQuery({
              socialProfiles,
              normalizedQuery: searchQuery,
            })
          }),
        ])

        if (result) {
          matchingTopics.push(group.topic)
        }
      } catch (error) {
        captureError(error)
      }
    }),
  )

  return matchingTopics
}

export function getSearchExistingGroupsByGroupMembersQueryOptions(args: {
  searchQuery: string
  searcherInboxId: InboxId
}) {
  const { searchQuery, searcherInboxId } = args
  const normalizedSearchQuery = normalizeString(searchQuery)
  return queryOptions({
    queryKey: ["search-existing-groups-by-group-members", normalizedSearchQuery, searcherInboxId],
    queryFn: () => {
      return searchExistingGroupsByGroupMembers({
        searchQuery: normalizedSearchQuery,
        searcherInboxId,
      })
    },
    enabled: !!normalizedSearchQuery && !!searcherInboxId,
    staleTime: 0,
    // Keep showing previous search results while new results load
    // to prevent UI flicker during search
    placeholderData: keepPreviousData,
  })
}

export function useSearchExistingGroupsByGroupMembersQuery(args: {
  searchQuery: string
  searcherInboxId: InboxId
}) {
  return useQuery(getSearchExistingGroupsByGroupMembersQueryOptions(args))
}
