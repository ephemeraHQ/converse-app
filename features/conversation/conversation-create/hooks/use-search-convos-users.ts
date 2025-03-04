import { keepPreviousData, queryOptions, skipToken, useQuery } from "@tanstack/react-query"
import { InboxId } from "@xmtp/react-native-sdk"
import { ISearchProfilesResult, searchProfiles } from "@/features/profiles/profiles.search.api"
import { isSameInboxId } from "@/features/xmtp/xmtp-inbox-id/xmtp-inbox-id.utils"
import { getSearchConvosUsersQueryKey } from "@/queries/QueryKeys"
import { DateUtils } from "@/utils/time.utils"

export function useSearchConvosUsersQuery(args: {
  searchQuery: string
  inboxIdsToOmit: InboxId[]
}) {
  const { searchQuery, inboxIdsToOmit } = args

  return useQuery({
    ...getConvosUsersSearchQueryOptions(searchQuery),
    select: (data: ISearchProfilesResult[]) => {
      // Filter out search results for inboxIds that should be omitted
      return data.filter(
        (profile) =>
          !inboxIdsToOmit.some((inboxIdToOmit) => isSameInboxId(profile.xmtpId, inboxIdToOmit)),
      )
    },
  })
}

function getConvosUsersSearchQueryOptions(searchQuery: string) {
  const enabled = !!searchQuery && searchQuery.trim().length > 0
  return queryOptions({
    enabled,
    queryKey: getSearchConvosUsersQueryKey(searchQuery),
    queryFn: enabled ? () => searchProfiles({ searchQuery }) : skipToken,
    staleTime: DateUtils.minutes(5).toMilliseconds(),
    // Keep showing previous search results while new results load
    // to prevent UI flicker during search
    placeholderData: keepPreviousData,
  })
}
